"""Chatbot API routes powered by Groq LLM for product search and assistance."""

import json
import re
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# ─── Schemas ──────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    message: str
    session_id: str


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


class SearchResponse(BaseModel):
    products: List[ProductCard]
    suggestions: List[str]


# ─── Keyword Catalogue (fallback when LLM is unavailable) ─────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "floor mats": ["floor mats", "floor mat", "mats", "mat", "car mat", "floor liner"],
    "led lights": ["led lights", "led light", "led", "led bar", "led bulb", "led headlight", "drl"],
    "seat covers": ["seat covers", "seat cover", "seats", "seat", "upholstery", "seat protector"],
    "dash camera": ["dash camera", "dashcam", "dash cam", "car camera", "recorder"],
    "infotainment": ["infotainment", "android screen", "touchscreen", "car stereo", "head unit"],
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


async def _search_medusa(query: str, limit: int = 5) -> List[ProductCard]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.MEDUSA_URL}/store/products",
                params={"q": query, "limit": limit},
            )
            resp.raise_for_status()
            return _format_medusa_products(resp.json())
    except (httpx.HTTPError, ValueError):
        return []


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


def _build_actions(products: List[ProductCard], category: Optional[str]) -> List[ChatAction]:
    actions: List[ChatAction] = []
    for p in products[:3]:
        actions.append(
            ChatAction(label=f"View {p.title[:30]}", type="link", value=f"/product/{p.handle}")
        )
    if category:
        actions.append(
            ChatAction(label=f"Browse all {category}", type="link", value="/")
        )
    actions.append(ChatAction(label="Talk to human support", type="link", value="https://wa.me/919949695030"))
    return actions[:6]


# ─── Groq LLM Integration ────────────────────────────────────────────────────

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


async def _llm_chat(message: str, groq_api_key: str) -> Optional[dict]:
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

    category = _extract_category(message)

    # Greeting — no LLM needed
    if _is_greeting(message):
        import random
        reply_text = random.choice(GREETING_RESPONSES)
        products = await _search_medusa("popular car accessories", limit=5)
        actions = _build_actions(products, None)
        return ChatReply(reply=reply_text, products=products, actions=actions)

    # Try Groq LLM first
    groq_key = getattr(settings, "GROQ_API_KEY", None)
    llm_result = None

    if groq_key:
        llm_result = await _llm_chat(message, groq_key)

    if llm_result:
        reply_text = llm_result.get("reply", "Here's what I found:")
        search_query = llm_result.get("search_query", message)
        category = category or llm_result.get("category")
        products = await _search_medusa(search_query, limit=5)

        if not products:
            products = await _search_medusa("car accessories", limit=5)
            reply_text += " Here are some popular items to browse."
    else:
        # Fallback to keyword-based search
        search_query = message
        products = await _search_medusa(search_query, limit=5)

        if not products and category:
            products = await _search_medusa(category, limit=5)

        if not products:
            import random
            reply_text = random.choice(FALLBACK_RESPONSES)
            products = await _search_medusa("car accessories", limit=5)
        else:
            count = len(products)
            if category:
                reply_text = f"Here's what I found in {category}: {count} product{'s' if count != 1 else ''} match."
            else:
                reply_text = f"Here's what I found: {count} product{'s' if count != 1 else ''} match."

    actions = _build_actions(products, category)
    suggestions = _build_suggestions(category, None)

    return ChatReply(reply=reply_text, products=products, actions=actions)
