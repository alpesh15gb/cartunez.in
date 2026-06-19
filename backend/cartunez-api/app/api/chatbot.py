"""Chatbot API routes for AI-powered product search and assistance."""

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
    """Incoming chat message from the frontend."""

    message: str
    session_id: str


class ProductCard(BaseModel):
    """Simplified product representation for chat responses."""

    id: str
    title: str
    handle: str
    thumbnail: Optional[str] = None
    price: Optional[str] = None
    description: Optional[str] = None


class ChatAction(BaseModel):
    """Action button the frontend can render."""

    label: str
    type: str
    value: str


class ChatReply(BaseModel):
    """Chatbot reply payload."""

    reply: str
    products: List[ProductCard]
    actions: List[ChatAction]


class SearchResponse(BaseModel):
    """Search endpoint response."""

    products: List[ProductCard]
    suggestions: List[str]


# ─── Keyword Catalogue ────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "floor mats": ["floor mats", "floor mat", "mats", "mat", "car mat", "floor liner"],
    "led lights": ["led lights", "led light", "led", "led bar", "led bulb", "led headlight", "drl"],
    "seat covers": ["seat covers", "seat cover", "seats", "seat", "upholstery", "seat protector"],
    "dash camera": ["dash camera", "dashcam", "dash cam", "dash board camera", "car camera", "recorder"],
    "infotainment": ["infotainment", "android screen", "touchscreen", "car stereo", "head unit", "car display"],
    "roof rails": ["roof rails", "roof rail", "roof rack", "luggage rack", "top rack"],
    "body cover": ["body cover", "car cover", "dust cover", "sun shade", "car shade"],
    "steering cover": ["steering cover", "steering wheel cover", "steering", "grip cover"],
    "mud flaps": ["mud flaps", "mud flap", "mudguard", "mud guard", "splash guard"],
    "perfume": ["perfume", "car perfume", "air freshener", "fragrance", "car freshener"],
    "mobile holder": ["mobile holder", "phone holder", "phone mount", "mobile mount", "car holder"],
    "reverse camera": ["reverse camera", "parking camera", "back camera", "rear view camera", "backup camera"],
    "sun film": ["sun film", "sun film tint", "window tint", "tint film", "privacy film"],
    "door visor": ["door visor", "door visors", "rain guard", "window visor", "wind deflector"],
    "alloy wheels": ["alloy wheels", "alloy wheel", "rims", "wheel", "alloy"],
    "horn": ["horn", "car horn", "multi horn", "musical horn", "air horn"],
    "flooring": ["flooring", "flooring lamination", "lamination", "floor lamination", "5d flooring", "7d flooring"],
    "armrest": ["armrest", "arm rest", "center armrest", "console armrest", "elbow rest"],
    "ambient light": ["ambient light", "ambient lights", "interior light", "mood light", "rgb light"],
}

VEHICLE_NAMES = [
    "creta", "venue", "seltos", "sonet", "carens",
    "thar", "scorpio", "xuv700", "xuv 700", "xuv300", "xuv 300", "bolero", "thar roxx",
    "nexon", "punch", "harrier", "safari", "altroz", "tiago", "tigor",
    "swift", "baleno", "brezza", "alto", "wagon r", "dzire", "ertiga", "fronx",
    "city", "amaze", "elevate", "wrv",
    "innova", "fortuner", "gla", "glc", "gls", "hilux", "camry", "hyryder",
    "taigun", "virtus", "kushaq", "slavia",
    "aura", "verna", "i20", "i10", "alcazar", " Tucson",
]

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
    """Match a message against known accessory categories."""
    lower = message.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return category
    return None


def _extract_vehicle(message: str) -> Optional[str]:
    """Extract a vehicle name from the message."""
    lower = message.lower()
    for name in VEHICLE_NAMES:
        if name in lower:
            return name.title()
    return None


def _extract_price_limit(message: str) -> Optional[int]:
    """Extract a numeric price limit from the message."""
    patterns = [
        r"under\s+(\d[\d,]*)",
        r"below\s+(\d[\d,]*)",
        r"less\s+than\s+(\d[\d,]*)",
        r"budget\s+(?:of\s+)?(\d[\d,]*)",
        r"within\s+(\d[\d,]*)",
        r"max(?:imum)?\s+(\d[\d,]*)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message.lower())
        if match:
            return int(match.group(1).replace(",", ""))
    return None


def _is_greeting(message: str) -> bool:
    """Check if the message is a simple greeting."""
    greetings = {"hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "yo", "sup"}
    lower = message.lower().strip().rstrip("!.?") 
    return lower in greetings


def _build_suggestions(category: Optional[str], vehicle: Optional[str]) -> List[str]:
    """Generate follow-up suggestion prompts."""
    suggestions: List[str] = []

    if category:
        other_categories = [c for c in CATEGORY_KEYWORDS if c != category]
        for c in other_categories[:3]:
            suggestions.append(f"Show me {c}")
    else:
        for c in list(CATEGORY_KEYWORDS)[:4]:
            suggestions.append(f"Show me {c}")

    if vehicle:
        suggestions.append(f"More accessories for {vehicle}")
    else:
        suggestions.append("What's compatible with my car?")

    suggestions.append("What's trending right now?")
    return suggestions[:5]


def _format_medusa_products(data: dict) -> List[ProductCard]:
    """Transform Medusa product list into chat-friendly cards."""
    products: List[ProductCard] = []
    for p in data.get("products", []):
        price: Optional[str] = None
        variants = p.get("variants", [])
        if variants:
            prices = variants[0].get("prices", [])
            if prices:
                price_val = prices[0].get("amount", 0)
                currency = prices[0].get("currency_code", "inr").upper()
                price = f"{currency} {price_val / 100:.2f}" if price_val else None

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


def _build_reply(
    message: str,
    category: Optional[str],
    vehicle: Optional[str],
    price_limit: Optional[int],
    products: List[ProductCard],
) -> str:
    """Construct a natural language reply."""
    if _is_greeting(message):
        return "Welcome to Car Tunez! We have a wide range of car accessories. What are you looking for today?"

    parts: List[str] = []

    if category and vehicle:
        parts.append(f"Here are the best {category} I found for your {vehicle}.")
    elif category:
        parts.append(f"Here's what I found in {category}:")
    elif vehicle:
        parts.append(f"Here are some great accessories for your {vehicle}:")
    else:
        parts.append("Here's what I found:")

    if price_limit:
        parts.append(f"Filtered to items under ₹{price_limit:,}.")

    count = len(products)
    if count == 0:
        parts.append("No exact matches, but try browsing our full catalog!")
    elif count == 1:
        parts.append("We have 1 product that matches.")
    else:
        parts.append(f"We have {count} products that match.")

    return " ".join(parts)


def _build_actions(products: List[ProductCard], category: Optional[str]) -> List[ChatAction]:
    """Build action buttons from products and context."""
    actions: List[ChatAction] = []

    for p in products[:3]:
        actions.append(
            ChatAction(label=f"View {p.title[:30]}", type="link", value=f"/products/{p.handle}")
        )

    if category:
        actions.append(
            ChatAction(label=f"Browse all {category}", type="link", value=f"/collections/{category.replace(' ', '-')}")
        )

    actions.append(ChatAction(label="Talk to human support", type="link", value="/support"))
    return actions[:6]


async def _search_medusa(query: str, limit: int = 5) -> List[ProductCard]:
    """Search products via Medusa store API."""
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


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Search products via Medusa + local vehicle DB for chatbot suggestions."""
    category = _extract_category(q)
    vehicle = _extract_vehicle(q)
    price_limit = _extract_price_limit(q)

    search_terms = q
    if vehicle:
        search_terms = search_terms.replace(vehicle.lower(), "").replace(vehicle, "")
    if price_limit:
        for pattern in [r"under\s+\d[\d,]*", r"below\s+\d[\d,]*", r"less\s+than\s+\d[\d,]*",
                        r"budget\s+(?:of\s+)?\d[\d,]*", r"within\s+\d[\d,]*", r"max(?:imum)?\s+\d[\d,]*"]:
            search_terms = re.sub(pattern, "", search_terms, flags=re.IGNORECASE)
    search_terms = " ".join(search_terms.split()) or (category or "car accessories")

    products = await _search_medusa(search_terms, limit=5)

    if price_limit and products:
        filtered: List[ProductCard] = []
        for p in products:
            if p.price:
                try:
                    numeric = float(re.sub(r"[^\d.]", "", p.price))
                    if numeric <= price_limit:
                        filtered.append(p)
                except ValueError:
                    filtered.append(p)
            else:
                filtered.append(p)
        products = filtered

    suggestions = _build_suggestions(category, vehicle)
    return SearchResponse(products=products, suggestions=suggestions)


@router.post("/message", response_model=ChatReply)
async def chat_message(
    body: ChatMessage,
    db: AsyncSession = Depends(get_db),
) -> ChatReply:
    """Process a chat message and return products, reply, and actions."""
    message = body.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    category = _extract_category(message)
    vehicle = _extract_vehicle(message)
    price_limit = _extract_price_limit(message)

    if _is_greeting(message):
        import random
        reply_text = random.choice(GREETING_RESPONSES)
        products = await _search_medusa("popular car accessories", limit=5)
        actions = _build_actions(products, None)
        return ChatReply(reply=reply_text, products=products, actions=actions)

    search_query = message
    if vehicle:
        search_query = search_query.replace(vehicle.lower(), "").replace(vehicle, "")
    search_query = " ".join(search_query.split()) or (category or "car accessories")

    products = await _search_medusa(search_query, limit=5)

    if price_limit and products:
        filtered_products: List[ProductCard] = []
        for p in products:
            if p.price:
                try:
                    numeric = float(re.sub(r"[^\d.]", "", p.price))
                    if numeric <= price_limit:
                        filtered_products.append(p)
                except ValueError:
                    filtered_products.append(p)
            else:
                filtered_products.append(p)
        products = filtered_products

    if not products and category:
        products = await _search_medusa(category, limit=5)

    if not products:
        import random
        reply_text = random.choice(FALLBACK_RESPONSES)
        products = await _search_medusa("car accessories", limit=5)
    else:
        reply_text = _build_reply(message, category, vehicle, price_limit, products)

    actions = _build_actions(products, category)
    return ChatReply(reply=reply_text, products=products, actions=actions)
