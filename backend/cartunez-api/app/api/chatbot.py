"""Chatbot API routes — AI shopping assistant.

Primary brain: Omniroute (multi-AI-provider gateway, preferred when configured),
then OpenAI (chat + vision + image mockups + tool calling), then Groq LLM,
then keyword-based catalogue matching.

Capabilities:
  * Product search with REAL Medusa results (tool calling, no hallucination)
  * Image upload + vision: "how will this look on my car" -> generated mockup
  * Human handoff when the assistant can't satisfy the customer
"""

import base64
import json
import random
import re
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

try:
    import redis.asyncio as aioredis
    _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    _redis_client = None

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# ─── Schemas ──────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    message: str
    session_id: str
    image: Optional[str] = None  # base64 data URL, e.g. data:image/jpeg;base64,...


class ProductCard(BaseModel):
    id: str
    title: str
    handle: str
    thumbnail: Optional[str] = None
    price: Optional[str] = None
    description: Optional[str] = None


class ChatAction(BaseModel):
    label: str
    type: str
    value: str


class ChatReply(BaseModel):
    reply: str
    products: List[ProductCard]
    actions: List[ChatAction]
    image_url: Optional[str] = None
    handoff: bool = False
    handoff_reason: Optional[str] = None


class SearchResponse(BaseModel):
    products: List[ProductCard]
    suggestions: List[str]


# ─── Limits ───────────────────────────────────────────────────────────────────

MAX_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB decoded payload cap (OpenAI edits limit)
MAX_HISTORY_TURNS = 6  # recent messages kept per session for context

# ─── Keyword Catalogue (fallback when LLM is unavailable) ─────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "floor mats": ["floor mats", "floor mat", "mats", "mat", "car mat", "floor liner"],
    "led lights": ["led lights", "led light", "led", "led bar", "led bulb", "led headlight", "drl"],
    "seat covers": ["seat covers", "seat cover", "seats", "seat", "upholstery", "seat protector"],
    "dash camera": ["dash camera", "dashcam", "dash cam", "car camera", "recorder"],
    "infotainment": ["infotainment", "android screen", "touchscreen", "car stereo", "head unit", "speaker", "music system"],
    "roof rails": ["roof rails", "roof rail", "roof rack", "luggage rack"],
    "body cover": ["body cover", "car cover", "dust cover", "sun shade"],
    "steering cover": ["steering cover", "steering wheel cover", "steering grip"],
    "mud flaps": ["mud flaps", "mud flap", "mudguard", "splash guard"],
    "perfume": ["perfume", "car perfume", "air freshener", "fragrance"],
    "mobile holder": ["mobile holder", "phone holder", "phone mount", "mobile mount"],
    "reverse camera": ["reverse camera", "parking camera", "rear view camera"],
    "sun film": ["sun film", "window tint", "tint film", "privacy film"],
    "door visor": ["door visor", "door visors", "rain guard", "window visor"],
    "alloy wheels": ["alloy wheels", "alloy wheel", "rims", "wheel", "alloy"],
    "horn": ["horn", "car horn", "multi horn", "musical horn", "air horn"],
    "flooring": ["flooring", "lamination", "floor lamination", "5d flooring", "7d flooring"],
    "armrest": ["armrest", "arm rest", "center armrest", "console armrest"],
    "ambient light": ["ambient light", "ambient lights", "interior light", "mood light"],
}

GREETING_RESPONSES = [
    "Hey there! Welcome to Car Tunez. How can I help you today?",
    "Hi! Looking for something for your car? Tell me what you need.",
    "Hello! I'm your Car Tunez assistant. Ask me about any car accessory!",
]

FALLBACK_RESPONSES = [
    "I couldn't find an exact match, but here are some popular products you might like.",
    "Let me search for that. In the meantime, here are some trending accessories.",
    "I'm still learning! Here are some products that might interest you.",
]

HANDOFF_PHRASES = [
    "talk to human",
    "talk to a human",
    "talk to someone",
    "real person",
    "speak to agent",
    "speak to a agent",
    "customer care",
    "call me",
    "not satisfied",
    "not helpful",
    "disappointed",
    "this doesn't help",
    "unhappy",
    "complaint",
    "refund",
    "return policy",
    "where is my order",
]


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _extract_category(message: str) -> Optional[str]:
    lower = message.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return category
    return None


def _is_greeting(message: str) -> bool:
    greetings = {"hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "yo", "sup"}
    lower = message.lower().strip().rstrip("!.? ")
    return lower in greetings


def _wants_mockup(message: str) -> bool:
    patterns = [
        r"how (will|would|does|do).*(look|fit|appear)",
        r"show me.*(on|in).*(car|vehicle|dashboard)",
        r"look.*(on|in) my car",
        r"preview",
        r"mockup",
        r"visuali[sz]e",
        r"imagine.*(on|in).*car",
        r"see.*(on|in).*car",
    ]
    lower = message.lower()
    return any(re.search(p, lower) for p in patterns)


def _wants_handoff(message: str) -> bool:
    lower = message.lower()
    return any(phrase in lower for phrase in HANDOFF_PHRASES)


def _format_medusa_products(data: dict) -> List[ProductCard]:
    products: List[ProductCard] = []
    for p in data.get("products", []):
        price: Optional[str] = None
        variants = p.get("variants", [])
        if variants:
            prices = variants[0].get("prices", [])
            if prices:
                price_val = prices[0].get("amount", 0)
                if price_val:
                    price = f"₹{price_val / 100:,.0f}"
        products.append(
            ProductCard(
                id=p.get("id", ""),
                title=p.get("title", ""),
                handle=p.get("handle", ""),
                thumbnail=p.get("thumbnail"),
                price=price,
                description=(p.get("description") or "")[:200],
            )
        )
    return products


def _safe_singularize(word: str) -> str:
    """Strip a trailing 's' only when it's almost certainly a plural
    (word > 3 chars, not ending in ss/us/is/os: glass, bus, focus...)."""
    if (
        len(word) > 3
        and word.endswith("s")
        and not word.endswith(("ss", "us", "is", "os"))
    ):
        return word[:-1]
    return word


async def _search_medusa(query: str, limit: int = 5) -> List[ProductCard]:
    """Search Medusa, retrying with simpler terms (Medusa's search is fuzzy
    and misses plurals — 'wheels' returns 0 while 'wheel' returns 74).

    Candidate ladder: full query, singularized phrase, then the singularized
    LAST word ("alloy wheels" -> "wheel"), which carries the product type.
    """
    words = query.strip().split()
    candidates = [query.strip()]
    if len(words) > 1:
        full_singular = " ".join(_safe_singularize(w) for w in words)
        if full_singular not in candidates:
            candidates.append(full_singular)
        last_word = _safe_singularize(words[-1])
        if last_word not in candidates:
            candidates.append(last_word)
        if words[-1] not in candidates:
            candidates.append(words[-1])
    elif words:
        singular = _safe_singularize(words[0])
        if singular not in candidates:
            candidates.append(singular)

    for q in candidates:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.MEDUSA_URL}/store/products",
                    params={"q": q, "limit": limit},
                )
                resp.raise_for_status()
                products = _format_medusa_products(resp.json())
                if products:
                    return products
        except (httpx.HTTPError, ValueError):
            continue
    return []


async def _fetch_medusa_product(handle: str) -> Optional[dict]:
    """Fetch one product's full details by handle (for the model's follow-up tool)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.MEDUSA_URL}/store/products",
                params={"handle": handle, "limit": 1},
            )
            resp.raise_for_status()
            products = _format_medusa_products(resp.json())
            if not products:
                return None
            p = products[0]
            return {
                "title": p.title,
                "handle": p.handle,
                "price": p.price,
                "description": p.description,
                "thumbnail": p.thumbnail,
            }
    except (httpx.HTTPError, ValueError):
        return None


def _build_suggestions(category: Optional[str], vehicle: Optional[str]) -> List[str]:
    suggestions: List[str] = []
    if category:
        other_categories = [c for c in CATEGORY_KEYWORDS if c != category]
        for c in other_categories[:3]:
            suggestions.append(f"Show me {c}")
    else:
        for c in list(CATEGORY_KEYWORDS.keys())[:4]:
            suggestions.append(f"Show me {c}")
    if vehicle:
        suggestions.append(f"More accessories for {vehicle}")
    else:
        suggestions.append("What's compatible with my car?")
    suggestions.append("What's trending right now?")
    return suggestions[:5]


def _build_actions(products: List[ProductCard], category: Optional[str], handoff: bool = False) -> List[ChatAction]:
    actions: List[ChatAction] = []
    for p in products[:3]:
        actions.append(
            ChatAction(label=f"View {p.title[:30]}", type="link", value=f"/product/{p.handle}")
        )
    if category:
        actions.append(
            ChatAction(label=f"Browse all {category}", type="link", value=f"/store?category={category}")
        )
    actions.append(ChatAction(label="Talk to human support", type="link", value="https://wa.me/919949695030"))
    return actions[:6]


def _decode_image(image_data_url: str) -> Optional[bytes]:
    """Decode a base64 data URL. Returns None if too large or malformed.

    The base64 string length is checked BEFORE decoding so a huge payload is
    rejected without allocating memory for it (DoS hardening).
    """
    try:
        if "," in image_data_url:
            header, b64 = image_data_url.split(",", 1)
            if "base64" not in header:
                return None
        else:
            b64 = image_data_url
        # 4 MB decoded ≈ ceil(4 * 4/3) base64 chars; reject early
        if len(b64) > (MAX_IMAGE_BYTES * 4 // 3) + 64:
            return None
        raw = base64.b64decode(b64)
        if len(raw) > MAX_IMAGE_BYTES:
            return None
        return raw
    except Exception:
        return None


async def _get_history(session_id: str) -> list:
    """Recent user/assistant turns for a session, oldest first."""
    if _redis_client is None:
        return []
    try:
        raw = await _redis_client.get(f"chat:{session_id}")
        if not raw:
            return []
        history = json.loads(raw)
        return history if isinstance(history, list) else []
    except Exception:
        return []


async def _push_history(session_id: str, entries: list) -> None:
    """Append new turns and keep the window bounded (1h TTL)."""
    if _redis_client is None:
        return
    try:
        history = await _get_history(session_id)
        history.extend(entries)
        trimmed = history[-MAX_HISTORY_TURNS:]
        await _redis_client.set(f"chat:{session_id}", json.dumps(trimmed), ex=3600)
    except Exception:
        return


# ─── Provider Resolution (Omniroute preferred, OpenAI fallback) ──────────────

# Omniroute is an OpenAI-compatible multi-AI-provider gateway: the same wire
# format works against it, and its `auto` model routes to the best available
# provider with automatic fallback on 429s/errors.


def _resolve_chat_provider() -> Optional[dict]:
    """Return the chat provider config to use (Omniroute preferred, else OpenAI)."""
    if settings.OMNIROUTE_URL:
        return {
            "base_url": settings.OMNIROUTE_URL.rstrip("/"),
            "api_key": settings.OMNIROUTE_API_KEY or "auto",
            "model": settings.OMNIROUTE_CHAT_MODEL or "auto",
            "name": "omniroute",
        }
    if settings.OPENAI_API_KEY:
        return {
            "base_url": "https://api.openai.com/v1",
            "api_key": settings.OPENAI_API_KEY,
            "model": settings.OPENAI_CHAT_MODEL,
            "name": "openai",
        }
    return None


def _resolve_image_provider() -> Optional[dict]:
    """Provider used for image mockup generation.

    Omniroute is preferred (the user's gateway has working image models, e.g.
    antigravity/gemini-3.1-flash-image); OpenAI is the fallback when no
    Omniroute is configured.
    """
    if settings.OMNIROUTE_URL:
        return {
            "base_url": settings.OMNIROUTE_URL.rstrip("/"),
            "api_key": settings.OMNIROUTE_API_KEY or "auto",
            "model": settings.OMNIROUTE_IMAGE_MODEL or "auto",
            "name": "omniroute",
        }
    if settings.OPENAI_API_KEY:
        return {
            "base_url": "https://api.openai.com/v1",
            "api_key": settings.OPENAI_API_KEY,
            "model": settings.OPENAI_IMAGE_MODEL,
            "name": "openai",
        }
    return None


# ─── OpenAI-compatible Integration ────────────────────────────────────────────

OPENAI_SYSTEM_PROMPT = """You are CarTunez's smart shopping assistant for an Indian car accessories store (cartunez.in).

Your store sells: Floor Mats, LED Lights, Seat Covers, Dash Cameras, Android/Infotainment Systems (car stereos, speakers), Alloy Wheels, Roof Rails, Body Covers, Steering Covers, Mud Flaps, Car Perfume, Mobile Holders, Reverse Cameras, Sun Film, Door Visors, Horns, Flooring/Lamination, Armrests, Ambient Lights.

How to help customers:
1. Understand what they need (category, car model, budget, whether they uploaded a car photo).
2. Use the search_products tool with a concise query to fetch REAL products from the store. Always search before recommending specific items — never invent product names, prices, or links.
3. After search_products returns, the product cards are shown to the customer automatically — so name those specific products (title + price) directly in your reply instead of pointing them to the search bar.
4. Reply in friendly, concise Hinglish-friendly English (1-3 sentences).
5. If the customer asks how a product would look on their car, call generate_mockup with a clear description of the product to visualize.
6. If you cannot help (order status, refunds, complaints, or the customer is unhappy and asks for a human), call escalate_to_human with a short reason.
7. If the customer just says hi, greet them warmly and suggest categories.
8. If the customer names a car (e.g. "Maruti Swift"), tailor recommendations and mention the site's vehicle fitment selector.

Be helpful, never pushy. Keep replies short."""

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search the Cartunez store for products matching the customer's need.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short product search query, e.g. 'android car stereo'"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_product_by_handle",
            "description": "Get full details (description, price) for a specific product by its handle.",
            "parameters": {
                "type": "object",
                "properties": {
                    "handle": {"type": "string", "description": "The product handle (URL slug), e.g. 'onkyo-stereo'"}
                },
                "required": ["handle"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_mockup",
            "description": "Generate an image showing how a product looks installed on / with the customer's car.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "What to visualize, e.g. 'a 9 inch android car stereo installed in the dashboard'"}
                },
                "required": ["subject"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": "Escalate to a human agent when the assistant cannot fully help.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string", "description": "Why the customer needs a human"}
                },
                "required": ["reason"],
            },
        },
    },
]


def _build_user_content(message: str, image_data_url: Optional[str]) -> list:
    content: list = [{"type": "text", "text": message}]
    if image_data_url:
        content.append({"type": "image_url", "image_url": {"url": image_data_url}})
    return content


async def _llm_chat_completion(provider: dict, messages: list, tools: Optional[list] = None, max_tokens: int = 500) -> Optional[dict]:
    """One chat completion call against any OpenAI-compatible endpoint."""
    try:
        # Fast connect timeout so a configured-but-down gateway fails over in
        # seconds; generous read timeout for cold auto-route first calls.
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0, read=45.0)) as client:
            payload: dict = {
                "model": provider["model"],
                "messages": messages,
                "temperature": 0.6,
                "max_tokens": max_tokens,
                # Some gateways (Omniroute) default to SSE streaming; our client
                # expects a single JSON response.
                "stream": False,
            }
            if tools:
                payload["tools"] = tools
                payload["tool_choice"] = "auto"
            resp = await client.post(
                f"{provider['base_url']}/chat/completions",
                headers={"Authorization": f"Bearer {provider['api_key']}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None


async def _llm_generate_mockup(provider: dict, subject: str, car_image: Optional[bytes]) -> Optional[str]:
    """Generate (or edit) an image via an OpenAI-compatible images endpoint.

    Image editing (customer's uploaded photo) is only supported by some
    providers (adobe-firefly, chatgpt-web, codex...). If the gateway rejects
    edits, we fall back to plain generation so the mockup feature still works.
    """
    prompt = (
        f"Photorealistic image: {subject}. "
        "Show it installed on a modern car with natural lighting, high detail, product catalog style."
    )
    headers = {"Authorization": f"Bearer {provider['api_key']}"}

    async def _request_images():
        """One images/generations call (text-to-image)."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0, read=60.0)) as client:
            resp = await client.post(
                f"{provider['base_url']}/images/generations",
                headers={**headers, "Content-Type": "application/json"},
                json={
                    "model": provider["model"],
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "response_format": "b64_json",
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def _request_edits():
        """One images/edits call (put the product on the uploaded car photo)."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0, read=60.0)) as client:
            resp = await client.post(
                f"{provider['base_url']}/images/edits",
                headers=headers,
                files={"image": ("car.jpg", car_image, "image/jpeg")},
                data={
                    "model": provider["model"],
                    "prompt": prompt,
                    "n": "1",
                    "size": "1024x1024",
                    "response_format": "b64_json",
                },
            )
            resp.raise_for_status()
            return resp.json()

    def _extract(data: dict) -> Optional[str]:
        items = data.get("data") or []
        if not items:
            return None
        b64 = items[0].get("b64_json")
        if b64:
            return f"data:image/png;base64,{b64}"
        return items[0].get("url")

    try:
        if car_image:
            try:
                return _extract(await _request_edits())
            except Exception:
                # Edits unsupported on this provider/gateway — fall back to a
                # text-to-image mockup so the customer still gets a visual.
                pass
        return _extract(await _request_images())
    except Exception:
        return None


async def _llm_chat_provider(
    provider: dict,
    message: str,
    image_data_url: Optional[str],
    session_id: str,
) -> Optional[dict]:
    """Iterative tool-calling loop against an OpenAI-compatible provider.

    Runs completions, executes requested tools, feeds results back, and repeats
    until the model replies with plain text (capped to avoid infinite loops).
    Returns a normalized result dict, or None if the provider is unreachable.
    """
    try:
        messages = [{"role": "system", "content": OPENAI_SYSTEM_PROMPT}]
        # Conversation memory: replay recent turns so "this car" / "that speaker"
        # keeps context from earlier in the chat.
        history = await _get_history(session_id)
        for turn in history:
            messages.append(turn)
        messages.append({"role": "user", "content": _build_user_content(message, image_data_url)})

        # Iterative tool loop: run a completion, execute any requested tools,
        # feed the results back, and repeat until the model answers in plain
        # text (capped so a tool-happy model can't spin forever).
        MAX_TOOL_ROUNDS = 2
        search_query: Optional[str] = None
        mockup_subject: Optional[str] = None
        handoff_reason: Optional[str] = None
        handoff: bool = False
        last_products: List[ProductCard] = []
        reply_text = ""

        for round_index in range(MAX_TOOL_ROUNDS + 1):
            # After the first two tool rounds, drop the tools so the model MUST
            # answer in plain text instead of looping tool calls forever.
            tools = OPENAI_TOOLS if round_index < MAX_TOOL_ROUNDS else None
            resp = await _llm_chat_completion(provider, messages, tools=tools)
            if not resp:
                return None
            msg = resp["choices"][0]["message"]
            tool_calls = msg.get("tool_calls") or []
            if not tool_calls:
                reply_text = (msg.get("content") or "").strip()
                break

            for tc in tool_calls:
                try:
                    args = json.loads(tc["function"].get("arguments") or "{}")
                except json.JSONDecodeError:
                    args = {}
                name = tc["function"].get("name", "")
                result: dict = {}
                if name == "search_products":
                    q = args.get("query") or message
                    search_query = q
                    last_products = await _search_medusa(q, limit=5)
                    result = {
                        "products": [
                            {"title": p.title, "handle": p.handle, "price": p.price, "thumbnail": p.thumbnail}
                            for p in last_products
                        ],
                        "count": len(last_products),
                        "note": "If the list is empty, tell the customer honestly and suggest alternatives.",
                    }
                elif name == "fetch_product_by_handle":
                    detail = await _fetch_medusa_product(args.get("handle", ""))
                    result = detail or {"error": "product not found"}
                elif name == "generate_mockup":
                    mockup_subject = args.get("subject") or message
                    result = {"status": "image_generation_started", "subject": mockup_subject}
                elif name == "escalate_to_human":
                    handoff = True
                    handoff_reason = args.get("reason") or "Customer requested human support"
                    result = {"status": "handoff_confirmed"}
                else:
                    # Model invented a tool we don't have: tell it it's unavailable
                    result = {"status": "unavailable", "note": "This tool is not available in this store."}

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result),
                    }
                )
        # The final (no-tools) round always breaks with a reply; the fallbacks
        # below cover empty/garbage text just in case.

        # Some auto-routed models emit template artifacts (<|start|>, <|channel|>…)
        # or empty content instead of a real sentence — build a clean reply from
        # the products we actually found.
        if "<|" in reply_text or not reply_text:
            if last_products:
                names = ", ".join(p.title for p in last_products[:3])
                reply_text = f"Here are {len(last_products)} options: {names}."
            else:
                reply_text = "Here's what I found:"

        # Generate mockup image if requested (or if the user clearly asked for a visual)
        image_url: Optional[str] = None
        if mockup_subject or _wants_mockup(message):
            car_image = _decode_image(image_data_url) if image_data_url else None
            image_provider = _resolve_image_provider()
            if image_provider:
                image_url = await _llm_generate_mockup(image_provider, mockup_subject or message, car_image)

        # Product cards for the UI: reuse the last search, else keyword fallback
        products: List[ProductCard] = last_products
        if not products:
            q = search_query or message
            products = await _search_medusa(q, limit=5)
            if not products:
                category = _extract_category(message)
                if category:
                    products = await _search_medusa(category, limit=5)

        return {
            "reply": reply_text or "Here's what I found:",
            "products": products,
            "image_url": image_url,
            "handoff": handoff or _wants_handoff(message),
            "handoff_reason": handoff_reason if handoff else None,
        }
    except Exception:
        return None


# ─── Groq Integration (fallback) ──────────────────────────────────────────────

GROQ_SYSTEM_PROMPT = """You are CarTunez's helpful car accessories assistant. You help customers find the right accessories for their cars.

Your store sells these categories of products:
- Floor Mats, LED Lights, Seat Covers, Dash Cameras, Infotainment Systems
- Alloy Wheels, Roof Rails, Body Covers, Steering Covers, Mud Flaps
- Car Perfume, Mobile Holders, Reverse Cameras, Sun Film, Door Visors
- Horns, Flooring/Lamination, Armrests, Ambient Lights

When a customer asks about a product:
1. Understand what they need (category, car model, budget)
2. Provide a helpful, friendly response
3. Suggest relevant product categories

IMPORTANT: Always respond with a JSON object in this exact format:
{
  "reply": "your helpful response text",
  "search_query": "search terms for product lookup",
  "category": "detected category or null"
}

Keep your reply concise (1-3 sentences). Be friendly and helpful.
If the customer just says hi/hello, welcome them warmly.
If they ask about pricing, tell them to check the product pages.
If they ask about compatibility, mention that the site has a vehicle selector tool."""


async def _llm_chat_groq(message: str, groq_api_key: str) -> Optional[dict]:
    """Call Groq LLM and parse the response."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": GROQ_SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 300,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception:
        return None


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    category = _extract_category(q)
    products = await _search_medusa(q, limit=5)
    suggestions = _build_suggestions(category, None)
    return SearchResponse(products=products, suggestions=suggestions)


@router.post("/message", response_model=ChatReply)
async def chat_message(
    body: ChatMessage,
    db: AsyncSession = Depends(get_db),
) -> ChatReply:
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    image_data_url = body.image
    if image_data_url and _decode_image(image_data_url) is None:
        raise HTTPException(status_code=400, detail="Image is too large or invalid (max 5 MB)")

    category = _extract_category(message)

    # Greeting — no LLM needed
    if _is_greeting(message):
        reply_text = random.choice(GREETING_RESPONSES)
        products = await _search_medusa("popular car accessories", limit=5)
        actions = _build_actions(products, None)
        return ChatReply(reply=reply_text, products=products, actions=actions)

    handoff = _wants_handoff(message)

    # 1) Omniroute (primary multi-provider gateway), then OpenAI, then Groq
    llm_result = None
    provider = _resolve_chat_provider()
    if provider:
        llm_result = await _llm_chat_provider(provider, message, image_data_url, body.session_id)

    if not llm_result and provider and provider["name"] == "omniroute" and settings.OPENAI_API_KEY:
        # Omniroute unreachable -> fall back to OpenAI directly
        llm_result = await _llm_chat_provider(
            {
                "base_url": "https://api.openai.com/v1",
                "api_key": settings.OPENAI_API_KEY,
                "model": settings.OPENAI_CHAT_MODEL,
                "name": "openai",
            },
            message,
            image_data_url,
            body.session_id,
        )

    # 2) Groq (fallback)
    if not llm_result:
        groq_key = getattr(settings, "GROQ_API_KEY", None)
        if groq_key:
            groq_result = await _llm_chat_groq(message, groq_key)
            if groq_result:
                reply_text = groq_result.get("reply", "Here's what I found:")
                search_query = groq_result.get("search_query", message)
                category = category or groq_result.get("category")
                products = await _search_medusa(search_query, limit=5)
                if not products:
                    products = await _search_medusa("car accessories", limit=5)
                    reply_text += " Here are some popular items to browse."
                llm_result = {"reply": reply_text, "products": products, "handoff": handoff}

    # 3) Keyword fallback
    if not llm_result:
        search_query = message
        products = await _search_medusa(search_query, limit=5)
        if not products and category:
            products = await _search_medusa(category, limit=5)
        if not products:
            reply_text = random.choice(FALLBACK_RESPONSES)
            products = await _search_medusa("car accessories", limit=5)
        else:
            count = len(products)
            if category:
                reply_text = f"Here's what I found in {category}: {count} product{'s' if count != 1 else ''} match."
            else:
                reply_text = f"Here's what I found: {count} product{'s' if count != 1 else ''} match."
        llm_result = {"reply": reply_text, "products": products, "handoff": handoff}

    reply_text = llm_result.get("reply", "Here's what I found:")
    products = llm_result.get("products", []) or []
    image_url = llm_result.get("image_url")
    handoff = handoff or bool(llm_result.get("handoff"))
    handoff_reason = llm_result.get("handoff_reason")

    if handoff:
        reply_text = (
            reply_text
            + " I'll connect you with our team right away. You can also call us at +91 9949695030, "
            + "WhatsApp us on the same number, or email adnan@cartunez.in."
        )

    actions = _build_actions(products, category, handoff)

    # Remember the conversation for context on the next turn
    await _push_history(
        body.session_id,
        [
            {"role": "user", "content": message},
            {"role": "assistant", "content": reply_text},
        ],
    )

    return ChatReply(
        reply=reply_text,
        products=products,
        actions=actions,
        image_url=image_url,
        handoff=handoff,
        handoff_reason=handoff_reason,
    )
