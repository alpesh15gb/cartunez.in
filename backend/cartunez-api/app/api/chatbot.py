"""Chatbot API routes — AI shopping assistant.

Primary brain: Omniroute (multi-AI-provider gateway, preferred when configured),
then OpenAI (chat + vision + image mockups + tool calling), then Groq LLM,
then keyword-based catalogue matching.

Capabilities:
  * Product search with REAL Medusa results (tool calling, no hallucination)
  * Image upload + vision: "how will this look on my car" -> generated mockup
  * Human handoff when the assistant can't satisfy the customer
"""

import asyncio
import base64
import json
import random
import re
import time
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
    customer_id: Optional[str] = None  # signed-in Medusa customer; ties memory + cart to the account


class ProductCard(BaseModel):
    id: str
    title: str
    handle: str
    thumbnail: Optional[str] = None
    price: Optional[str] = None
    description: Optional[str] = None
    variant_id: Optional[str] = None


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
    # Assistant-built cart / order state (surfaced to the storefront widget)
    cart_id: Optional[str] = None
    checkout_url: Optional[str] = None
    order_id: Optional[str] = None


class SearchResponse(BaseModel):
    products: List[ProductCard]
    suggestions: List[str]


# ─── Limits ───────────────────────────────────────────────────────────────────

MAX_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB decoded payload cap (OpenAI edits limit)
MAX_HISTORY_TURNS = 6  # recent messages kept per session for context
MAX_USER_HISTORY_TURNS = 14  # signed-in customers get a wider memory window

# ─── Keyword Catalogue (fallback when LLM is unavailable) ─────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "floor mats": ["floor mats", "floor mat", "mats", "mat", "car mat", "floor liner"],
    "led lights": ["led lights", "led light", "led", "led bar", "led bulb", "led headlight", "drl"],
    "seat covers": ["seat covers", "seat cover", "seats", "seat", "upholstery", "seat protector"],
    "dash camera": ["dash camera", "dashcam", "dash cam", "car camera", "recorder"],
    "infotainment": ["infotainment", "android screen", "android", "touchscreen", "car stereo", "stereo", "head unit", "speaker", "amplifier", "subwoofer", "music system"],
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
    "Namaste! Car Tunez me aapka swagat hai 🚗 Kya dhoondh rahe ho — floor mats, stereo, LED lights ya kuch aur?",
    "Hi! Main Car Tunez ka assistant hoon. Apni car ke liye kya chahiye, batao?",
    "Hello! Car Tunez me aapka swagat hai. Batao, kis accessory ki zaroorat hai?",
]

FALLBACK_RESPONSES = [
    "Hmm, store me iska exact match nahi mila. Koi specific product batao — jaise 'bluetooth speaker', 'seat covers' ya 'alloy wheels'?",
    "Sorry, ye product abhi stock me nahi mila. Product ka naam batao, main turant check karta hoon.",
    "Mujhe exact match nahi mila. Thoda specific batao — kya chahiye ya apni car ka model?",
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
                variant_id=variants[0].get("id") if variants else None,
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


def _price_to_int(price: Optional[str]) -> Optional[int]:
    """Parse a formatted price ('₹11,900') back to rupees, or None."""
    if not price:
        return None
    try:
        return int(price.replace("₹", "").replace(",", "").strip())
    except ValueError:
        return None


def _extract_budget(message: str) -> Optional[int]:
    """Parse a budget (in rupees) from the customer's message, or None.

    Handles 'under 10000', 'within 15k', 'budget 20000', '10k tak',
    '₹12,000 ke andar', '1.5 lakh', '8000 me', or a bare 'give me 10000'.
    Year-like numbers (1950-2100) are ignored so '2022 swift' isn't read as
    a ₹2,022 budget.
    """
    lower = re.sub(r"[₹,]|\brs\.?", "", message.lower())

    def _val(num_str: str, suffix: str = "") -> Optional[int]:
        try:
            num = float(num_str)
        except ValueError:
            return None
        s = (suffix or "").lower()
        if s.startswith("k") or s.startswith("t"):
            return int(num * 1000)
        if s.startswith("l"):
            return int(num * 100_000)
        return int(num)

    hits: list[int] = []

    # 1) number with k/lakh suffix: "10k", "1.5 lakh", "10 thousand"
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(k|lakh|lacs|lac|thousand)\b", lower):
        v = _val(m.group(1), m.group(2))
        if v is not None and v >= 500:
            hits.append(v)

    # 2) budget word BEFORE the number: "under 10000", "within 15k", "budget 20000"
    for m in re.finditer(
        r"(under|below|within|upto|up to|less than|max(?:imum)?|around|budget|approximately|approx)\s*(?:rs\.?)?\s*(\d+(?:\.\d+)?)\s*(k|lakh|lacs|lac|thousand)?",
        lower,
    ):
        v = _val(m.group(2), m.group(3) or "")
        if v is not None and v >= 500:
            hits.append(v)

    # 3) number BEFORE a trailing budget word: "10000 tak", "15000 ke andar", "20000 me", "8000 ka"
    for m in re.finditer(
        r"(\d+(?:\.\d+)?)\s*(?:rs\.?)?\s*(tak|se kam|se niche|ke andar|ke liye|mein|me|ka|ki)\b",
        lower,
    ):
        v = _val(m.group(1))
        if v is not None and v >= 500 and not (1950 <= v <= 2100):
            hits.append(v)

    # 4) bare 4-6 digit amount ("give me 10000") — never a year, never inside
    #    a longer digit run like a phone number
    for m in re.finditer(r"(?<!\d)(\d{4,6})(?!\d)", lower):
        v = _val(m.group(1))
        if v is not None and v >= 500 and not (1950 <= v <= 2100):
            hits.append(v)

    return max(hits) if hits else None


# Words to drop from a search query so Medusa matches the PRODUCT, not the car
# ("speaker for my Maruti Swift" -> "speaker") or generic filler words.
_VEHICLE_TOKENS = {
    "maruti", "suzuki", "swift", "baleno", "dzire", "ertiga", "brezza",
    "wagonr", "wagon", "alto", "celerio", "ignis", "jimny", "s-presso",
    "hyundai", "i10", "i20", "creta", "venue", "santro", "aura", "verna",
    "tucson", "alcazar", "grand", "tata", "nexon", "punch", "altroz", "tiago",
    "tigor", "harrier", "safari", "sierra", "curvv", "thar", "scorpio",
    "bolero", "marazzo", "kia", "seltos", "sonet", "carens", "honda", "city",
    "amaze", "civic", "elevate", "toyota", "fortuner", "innova", "camry",
    "corolla", "hyryder", "glanza", "renault", "duster", "kwid", "triber",
    "kiger", "nissan", "magnite", "ford", "ecosport", "figo", "aspire",
    "volkswagen", "vento", "polo", "virtus", "taigun", "skoda", "kushaq",
    "slavia", "octavia", "superb", "rapid", "fabia", "hector", "astor",
    "gloster", "comet", "compass", "meridian", "citroen", "mahindra", "xuv",
    "kuv", "tuv", "suv", "sedan", "hatchback", "muv",
}

_FILLER_WORDS = {
    "for", "my", "your", "me", "a", "an", "the", "i", "want", "need", "show",
    "get", "give", "find", "please", "pls", "some", "looking", "recommend",
    "best", "cheap", "good", "nice", "under", "budget", "price", "of", "in",
    "on", "to", "with", "and", "or", "car", "vehicle", "accessories",
    "accessory", "compatible", "fitment", "fitting", "ke", "liye", "ki", "ka",
    "kya", "chahiye", "mere", "meri", "apne", "apni", "hai", "batao", "wali",
    "wale", "mein", "se", "kaise", "kitne", "mujhe", "main", "aapke", "aapki",
    "popular", "trending", "recommended", "top", "hot", "all", "available",
    "kuch", "aur", "below", "within", "upto", "around", "less", "tak",
    "andar", "kam", "niche", "hisab", "upar",
}


def _clean_query(query: str) -> str:
    """Drop vehicle brand/model words and filler from a search query.

    "speaker for my Maruti Swift" -> "speaker". Returns "" when nothing
    meaningful remains (e.g. "popular car accessories"), signalling a browse
    request in _search_medusa.
    """
    words = query.lower().split()
    kept = [
        w
        for w in words
        if w not in _FILLER_WORDS
        and w not in _VEHICLE_TOKENS
        # Drop standalone numbers / budget amounts ("15000", "15k") — the
        # model often copies the budget into the search query, and the strict
        # title filter would then demand the number appear in a title.
        and not re.fullmatch(r"\d+(?:\.\d+)?k?", w)
    ]
    return " ".join(kept)


def _word_matches(title_word: str, query_word: str) -> bool:
    """Stem-ish match: 'speaker'~'speakers', 'cam'~'camera', 'stereo'~'stereos'."""
    if not title_word or not query_word:
        return False
    if len(query_word) < 3:
        return title_word == query_word
    return title_word == query_word or title_word.startswith(query_word) or query_word.startswith(title_word)


def _score_product(title: str, query_words: list) -> int:
    """How well a product title matches the search words.

    Score = 1 per query word found in the title (stem-aware) + 3 if the full
    phrase appears. A result is "relevant" when EVERY query word matched.
    """
    if not query_words:
        return 0
    lower = title.lower()
    tokens = re.findall(r"[a-z0-9]+[a-z0-9-]*", lower)
    score = 0
    phrase = " ".join(query_words)
    if phrase in lower:
        score += 3
    for w in query_words:
        if any(_word_matches(t, w) for t in tokens):
            score += 1
    return score


def _dedupe_sentences(text: str) -> str:
    """Collapse near-identical sentences (auto-routed models often restate
    the same sentence several times with small variations)."""
    tokens = re.split(r"([.!?]+)\s*", text.strip())
    sentences = ["".join(tokens[i : i + 2]).strip() for i in range(0, len(tokens) - 1, 2)]
    if len(tokens) % 2 == 1 and tokens[-1].strip():
        sentences.append(tokens[-1].strip())
    kept: list[str] = []
    _word_re = re.compile("[a-z0-9\u0900-\u097f]+")
    for s in sentences:
        if not s:
            continue
        words = {w for w in _word_re.findall(s.lower()) if len(w) > 3}
        dup = False
        for prev in kept:
            pv = {w for w in _word_re.findall(prev.lower()) if len(w) > 3}
            if words and pv and len(words & pv) / min(len(words), len(pv)) > 0.7:
                dup = True
                break
        if not dup:
            kept.append(s)
    return " ".join(kept)


def _title_mentioned(reply: str, title: str) -> bool:
    """True if the reply clearly names this product: at least two of its words
    appear, or one distinctive word (brand-length, >= 8 chars) does. A single
    generic word like 'dash' is NOT enough."""
    if not reply or not title:
        return False
    reply_lower = reply.lower()
    words = [w for w in title.lower().split() if len(w) > 3 and w.isalpha()]
    hits = [w for w in words if w in reply_lower]
    return len(hits) >= 2 or any(len(w) >= 5 for w in hits)


# Phrases that signal "add/buy this" in Hinglish or English — used to GUARANTEE
# the add happens even if the routed LLM stalls (it sometimes loops on repeated
# identical searches instead of calling add_to_cart).
_ADD_PHRASES = [
    "add karo", "add kijiye", "add kar do", "add to cart", "cart me",
    "cart mein", "cart mai", "cart me daal", "cart me dal", "daal do",
    "dal do", "dalo", "daal de", "le lo", "lelo", "le lu", "le lunga",
    "kharid lo", "kharido", "kharidna hai", "khareedna hai", "order karo",
    "order karde", "order kar do", "order de do", "ye lo", "ye le",
    "mujhe ye chahiye", "mujhe ye lena hai", "i want to buy", "i want this",
    "take this", "get this", "add this", "add it", "buy it", "keep this",
]


def _extract_add_intent(message: str) -> bool:
    lower = message.lower()
    if any(p in lower for p in _ADD_PHRASES):
        return True
    return bool(re.search(r"\b(buy|purchase|order it)\b", lower))


def _extract_quantity(message: str) -> int:
    """Quantity from 'quantity 2', 'qty:2', '2x', '2 pieces'. Default 1."""
    m = re.search(r"\b(?:quantity|qty)\s*[:=]?\s*(\d+)", message.lower())
    if m:
        return max(1, int(m.group(1)))
    m = re.search(r"\b(\d+)\s*x\b", message.lower())
    if m:
        return max(1, int(m.group(1)))
    return 1


def _pick_best_product(products: List[ProductCard], query: str) -> Optional[ProductCard]:
    """The product whose title best matches the (car/filler-stripped) query."""
    if not products:
        return None
    words = [_safe_singularize(w) for w in _clean_query(query).split()]
    if not words:
        return products[0]
    return max(products, key=lambda p: _score_product(p.title, words))


def _tool_sig(tc: dict) -> str:
    """Stable signature of a tool call (name + normalized args) for loop guards."""
    fn = tc.get("function") or {}
    try:
        args = json.dumps(json.loads(fn.get("arguments") or "{}"), sort_keys=True)
    except json.JSONDecodeError:
        args = fn.get("arguments") or ""
    return f"{fn.get('name')}:{args}"


# ─── Vehicle fitment (make the assistant actually KNOW what fits) ─────────────

# Make aliases -> canonical term for /api/v1/vehicles/resolve (ilike match).
_VEHICLE_MAKE_ALIASES = {
    "maruti suzuki": "maruti",
    "maruti": "maruti",
    "suzuki": "maruti",
    "hyundai": "hyundai",
    "tata": "tata",
    "mahindra": "mahindra",
    "kia": "kia",
    "honda": "honda",
    "toyota": "toyota",
    "renault": "renault",
    "nissan": "nissan",
    "ford": "ford",
    "volkswagen": "volkswagen",
    "vw": "volkswagen",
    "skoda": "skoda",
    "jeep": "jeep",
    "citroen": "citroen",
    "mg": "mg",
}

# High-confidence model tokens (unlikely to appear in ordinary chat).
_VEHICLE_MODEL_TOKENS = {
    "swift", "baleno", "dzire", "ertiga", "brezza", "wagonr", "alto",
    "celerio", "ignis", "jimny", "i10", "i20", "creta", "venue", "santro",
    "verna", "tucson", "alcazar", "nexon", "altroz", "tiago", "tigor",
    "harrier", "safari", "sierra", "thar", "scorpio", "bolero", "marazzo",
    "seltos", "sonet", "carens", "amaze", "civic", "elevate", "fortuner",
    "innova", "camry", "corolla", "hyryder", "glanza", "duster", "kwid",
    "triber", "kiger", "magnite", "ecosport", "figo", "aspire", "vento",
    "polo", "virtus", "taigun", "kushaq", "slavia", "octavia", "superb",
    "rapid", "fabia", "hector", "astor", "gloster", "comet", "compass",
    "meridian",
}

# Ambiguous words — only treated as models when a make is also named.
_VEHICLE_MODEL_AMBIGUOUS = {"city", "punch", "aura", "wagon"}

_VEHICLE_MODEL_NORM = {"wagonr": "wagon r", "wagon": "wagon r"}


_EXT_YEAR_RE = re.compile(r"\b(19[7-9]\d|20[0-3]\d)\b")


def _extract_vehicle(message: str) -> Optional[dict]:
    """Best-effort make/model/year extraction from a natural-language message.

    The LLM is the primary extractor (via check_fitment args); this is the
    code-level fallback so fitment works even when the routed model passes
    nothing.
    """
    lower = re.sub(r"[^a-z0-9 ]", " ", message.lower())
    words = set(lower.split())

    make = None
    for alias, name in _VEHICLE_MAKE_ALIASES.items():
        # 2-letter aliases (mg, vw) must be whole words — 'amazing' contains
        # 'mg' and must never be read as the MG car brand.
        if len(alias) <= 2:
            if re.search(rf"\b{re.escape(alias)}\b", lower):
                make = name
                break
        elif alias in lower:
            make = name
            break

    model = None
    for tok in _VEHICLE_MODEL_TOKENS:
        if tok in words:
            model = _VEHICLE_MODEL_NORM.get(tok, tok)
            break
    if model is None and make:
        for tok in _VEHICLE_MODEL_AMBIGUOUS:
            if tok in words:
                model = _VEHICLE_MODEL_NORM.get(tok, tok)
                break

    year = None
    m = _EXT_YEAR_RE.search(message)
    if m:
        year = int(m.group(0))

    if not make and not model:
        return None
    return {"make": make, "model": model, "year": year}


_RESOLVE_CACHE: dict = {}  # (make, model, year) -> {data, ts}
_FIT_CACHE: dict = {}      # year_id -> {compatible_ids, universal_ids, ts}


async def _resolve_vehicle(
    make: Optional[str], model: Optional[str], year: Optional[int]
) -> Optional[dict]:
    """Resolve a car to its year_id + variant_ids via FastAPI's own /resolve."""
    key = ((make or "").strip().lower(), (model or "").strip().lower(), year)
    cached = _RESOLVE_CACHE.get(key)
    if cached and time.time() - cached.get("ts", 0) < 300:
        return cached["data"]
    params: dict = {}
    if make:
        params["make"] = make
    if model:
        params["model"] = model
    if year:
        params["year"] = year
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.SELF_API_URL}/api/v1/vehicles/resolve", params=params
            )
            resp.raise_for_status()
            data = resp.json()
        _RESOLVE_CACHE[key] = {"data": data, "ts": time.time()}
        return data
    except (httpx.HTTPError, ValueError):
        return None


async def _fitment_for_car(
    make: Optional[str], model: Optional[str], year: Optional[int]
) -> Optional[dict]:
    """Fitment context for a car: compatible + universal product id sets.

    A product fits the car when it is linked to one of the car's variants OR it
    has no compatibility records at all (universal = fits every vehicle). The
    lookup is defensive: it unions products-by-year, per-variant lookups, and
    the universal set, so it degrades gracefully if Medusa's vehicle tables are
    unseeded or a route is missing. When nothing is returned, `known` is False
    and callers must say "fitment data unavailable" — never "does not fit".
    """
    resolved = await _resolve_vehicle(make, model, year)
    if not resolved or not resolved.get("found"):
        return None
    year_id = resolved.get("year_id")
    cached = _FIT_CACHE.get(year_id)
    if not cached or time.time() - cached.get("ts", 0) >= 300:
        compatible: set = set()
        universal: set = set()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # 1) products-by-year (compat rows + universal ids)
                try:
                    r1 = await client.get(
                        f"{settings.MEDUSA_URL}/vehicle/products-by-year/{year_id}"
                    )
                    if r1.status_code == 200:
                        data = r1.json()
                        compatible.update(
                            row.get("product_id")
                            for row in (data.get("products") or [])
                            if row.get("product_id")
                        )
                        universal.update(data.get("universal_product_ids") or [])
                except (httpx.HTTPError, ValueError):
                    pass
                # 2) per-variant lookups (parallel) — works even when Medusa's
                #    own variant table isn't seeded, because compat rows carry
                #    the same deterministic variant UUIDs as FastAPI's /resolve.
                vids = (resolved.get("variant_ids") or [])[:8]
                if vids:
                    variant_resps = await asyncio.gather(
                        *(
                            client.get(f"{settings.MEDUSA_URL}/vehicle/products/{vid}")
                            for vid in vids
                        ),
                        return_exceptions=True,
                    )
                    for r2 in variant_resps:
                        if isinstance(r2, Exception) or r2.status_code != 200:
                            continue
                        compatible.update(
                            row.get("product_id")
                            for row in (r2.json().get("products") or [])
                            if row.get("product_id")
                        )
        except (httpx.HTTPError, ValueError):
            pass
        cached = {
            "compatible_ids": sorted(compatible),
            "universal_ids": sorted(universal),
            "ts": time.time(),
        }
        _FIT_CACHE[year_id] = cached
    fit_ids = set(cached["compatible_ids"]) | set(cached["universal_ids"])
    return {
        "found": True,
        "make": (resolved.get("make") or {}).get("name"),
        "model": (resolved.get("model") or {}).get("name"),
        "year": (resolved.get("year") or {}).get("year"),
        "year_id": year_id,
        "compatible_ids": cached["compatible_ids"],
        "universal_ids": cached["universal_ids"],
        "known": bool(fit_ids),
    }


async def _fitment_context(
    message: str, profile: dict, cart_state: dict
) -> Optional[dict]:
    """Resolve the customer's car once per turn so search results can be tagged."""
    car = cart_state.get("car")
    if not car:
        car = _extract_vehicle(message)
        if not car and profile:
            pcar = profile.get("car") or {}
            if pcar.get("make") or pcar.get("model"):
                car = {
                    "make": pcar.get("make"),
                    "model": pcar.get("model"),
                    "year": pcar.get("year"),
                }
        if car:
            cart_state["car"] = car
    if not car:
        return None
    fit = await _fitment_for_car(car.get("make"), car.get("model"), car.get("year"))
    if not fit or not fit.get("found"):
        return {"car": car, "found": False}
    return {
        "car": car,
        "found": True,
        "known": bool(fit.get("known")),
        "label": f"{fit['make']} {fit['model']} {fit['year']}".strip(),
        "year_id": fit["year_id"],
        "fit_ids": set(fit["compatible_ids"]) | set(fit["universal_ids"]),
    }


# ─── Store policies (answer shipping/returns/COD questions instead of handing off) ─

STORE_POLICIES: dict[str, str] = {
    "shipping": (
        "Shipping & delivery: Orders are usually dispatched within 24-48 hours of "
        "confirmation. Delivery typically takes 2-5 working days across India and you "
        "get a tracking update. Heavy items like alloy wheels and car covers may take "
        "a little longer."
    ),
    "returns": (
        "Returns & refunds: If a product is damaged, defective, or the wrong item "
        "arrives, report it within 7 days of delivery. Once verified, we arrange a "
        "pickup and refund the original payment method (COD orders get a bank/NEFT "
        "refund) within 5-7 working days. Change-of-mind returns must be unused, in "
        "original packaging; a small pickup charge may apply."
    ),
    "cod": (
        "Cash on Delivery: Yes, COD is available across most of India. Keep the exact "
        "amount ready for the delivery partner. A nominal COD fee may apply on some "
        "orders."
    ),
    "warranty": (
        "Warranty: Electronics (stereos, speakers, dash cams, lighting) come with "
        "brand/manufacturer warranty as shown on the product page (typically 6-12 "
        "months). Warranty is handled by the brand — keep your invoice safe."
    ),
    "installation": (
        "Installation: We offer installation at partner shops — book via the "
        "'Installation Booking' form on the site. Stereos, speakers, dash cams, alloy "
        "wheels and sun film are best installed by professionals."
    ),
    "payment": (
        "Payment: We accept Cash on Delivery, UPI, cards, and net-banking via the "
        "site's secure checkout. Never share card details over chat."
    ),
    "tracking": (
        "Order tracking: You'll get the tracking link on email/WhatsApp once "
        "dispatched. For order status, call or WhatsApp +91 9949695030 or email "
        "adnan@cartunez.in with your order id."
    ),
    "contact": (
        "Contact: Call or WhatsApp +91 9949695030, or email adnan@cartunez.in — we "
        "help with fitment, orders, and installation queries."
    ),
}

STORE_POLICY_TOPICS = list(STORE_POLICIES.keys())

_POLICY_KEYWORDS: dict[str, list[str]] = {
    "shipping": ["shipping", "delivery", "deliver", "dispatch", "shipping charge", "kitne din me aayega", "kab tak aayega"],
    "returns": ["return", "refund", "wrong item", "damaged", "defective", "wapas", "change of mind", "7 days"],
    "cod": ["cod", "cash on delivery"],
    "warranty": ["warranty", "waranty", "guarantee"],
    "installation": ["install", "fitting", "installation", "baithega", "fit karwana"],
    "payment": ["payment", "upi", "card se", "netbanking", "pay kaise", "pay karne"],
    "tracking": ["track", "order status", "kahan hai order", "tracking"],
    "contact": ["contact", "phone number", "call karo", "email karo"],
}


def _detect_policy_topic(message: str) -> Optional[str]:
    """Detect which store-policy topic a message asks about (code-level, so
    policy answers work even when the routed model stalls)."""
    lower = message.lower()
    for topic, kws in _POLICY_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            return topic
    return None


def _policy_lookup(topic: str) -> str:
    """Curated policy answer for a topic; lists topics when unknown."""
    t = (topic or "").lower().strip()
    if t in STORE_POLICIES:
        return STORE_POLICIES[t]
    for key, text in STORE_POLICIES.items():
        if key in t or t in key:
            return text
    return f"Available topics: {', '.join(STORE_POLICY_TOPICS)}."


async def _search_medusa(query: str, limit: int = 5, max_price: Optional[int] = None) -> List[ProductCard]:
    """Search Medusa for RELEVANT products.

    Medusa's fuzzy search misses plurals ('wheels' -> 0, 'wheel' -> 74) and
    returns broad matches, so we (1) strip car brand/model + filler words from
    the query, (2) try a ladder of candidates, and (3) re-rank by how well the
    product title matches the search words. Only relevant titles make the cut.
    When max_price is set, only products at or under that budget are returned.
    """
    cleaned = _clean_query(query)
    words = cleaned.split()
    if not words:
        # Browse request ("popular", "trending", greeting) -> newest products
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.MEDUSA_URL}/store/products",
                    params={"limit": 30, "order": "-created_at"},
                )
                resp.raise_for_status()
                batch = _format_medusa_products(resp.json())
                if max_price:
                    batch = [p for p in batch if p.price is None or (_price_to_int(p.price) or 0) <= max_price]
                return batch[:limit]
        except (httpx.HTTPError, ValueError):
            return []

    candidates = [cleaned]
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

    query_words = [_safe_singularize(w) for w in words]

    # Fetch a wider window and keep ONLY products whose title contains EVERY
    # search word (stem-aware). Medusa's fuzzy search returns broad junk
    # ('wheel' -> steering wheels, fog lamps), so anything that doesn't fully
    # match is dropped — an honest empty result beats showing wrong products.
    scored_seen: dict[str, ProductCard] = {}
    # Fetch a wider window when a budget filter is applied so cheaper matches
    # aren't crowded out before filtering.
    target = limit * 3 if max_price else limit
    for q in candidates:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.MEDUSA_URL}/store/products",
                    params={"q": q, "limit": 30},
                )
                resp.raise_for_status()
                batch = _format_medusa_products(resp.json())
        except (httpx.HTTPError, ValueError):
            continue
        if not batch:
            continue
        for p in batch:
            if _score_product(p.title, query_words) >= len(query_words):
                scored_seen.setdefault(p.id, p)
        if len(scored_seen) >= target:
            break
    matched = list(scored_seen.values())
    if max_price:
        matched = [p for p in matched if p.price is None or (_price_to_int(p.price) or 0) <= max_price]
    return matched[:limit]


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


def _memory_key(session_id: str, customer_id: Optional[str]) -> str:
    """Conversation-memory Redis key: per-customer when signed in (survives
    sessions and devices), per-session otherwise."""
    if customer_id:
        return f"chat:user:{customer_id}"
    return f"chat:{session_id}"


async def _get_history(session_id: str, customer_id: Optional[str] = None) -> list:
    """Recent user/assistant turns for a session or customer, oldest first."""
    if _redis_client is None:
        return []
    try:
        raw = await _redis_client.get(_memory_key(session_id, customer_id))
        if not raw:
            return []
        history = json.loads(raw)
        return history if isinstance(history, list) else []
    except Exception:
        return []


async def _push_history(
    session_id: str, entries: list, customer_id: Optional[str] = None
) -> None:
    """Append new turns and keep the window bounded.

    Anonymous sessions get a 1h TTL and a short window; signed-in customers get
    90 days and a wider window so the assistant truly remembers them.
    """
    if _redis_client is None:
        return
    try:
        key = _memory_key(session_id, customer_id)
        history = await _get_history(session_id, customer_id)
        history.extend(entries)
        window = MAX_USER_HISTORY_TURNS if customer_id else MAX_HISTORY_TURNS
        trimmed = history[-window:]
        ttl = 90 * 24 * 3600 if customer_id else 3600
        await _redis_client.set(key, json.dumps(trimmed), ex=ttl)
    except Exception:
        return


async def _merge_into_user(session_id: str, customer_id: str) -> None:
    """Fold an anonymous session's turns into the customer's long-lived memory
    so a chat started before sign-up survives the account creation. Existing
    customer memory is preserved (only genuinely new turns are appended)."""
    if _redis_client is None or not session_id or not customer_id:
        return
    try:
        session_hist = await _get_history(session_id)
        if not session_hist:
            return
        user_hist = await _get_history("", customer_id)
        existing = {json.dumps(t, sort_keys=True) for t in user_hist}
        fresh = [
            t for t in session_hist if json.dumps(t, sort_keys=True) not in existing
        ]
        if fresh:
            await _push_history("", fresh, customer_id=customer_id)
    except Exception:
        return


async def _get_profile(memory_key: str) -> dict:
    """Structured customer profile (car, budget, interests) — survives visits."""
    if _redis_client is None:
        return {}
    try:
        raw = await _redis_client.get(f"chat:profile:{memory_key}")
        data = json.loads(raw) if raw else {}
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


async def _save_profile(memory_key: str, updates: dict) -> None:
    if _redis_client is None or not updates:
        return
    try:
        profile = await _get_profile(memory_key)
        profile.update(updates)
        ttl = 90 * 24 * 3600 if memory_key.startswith("chat:user:") else 3600
        await _redis_client.set(f"chat:profile:{memory_key}", json.dumps(profile), ex=ttl)
    except Exception:
        return


# ─── Cart & Orders (the assistant can build a cart and place an order) ────────

_REGION_CACHE: dict = {"region": None, "ts": 0.0}


async def _get_default_region() -> Optional[dict]:
    """Default region (first one, usually India) with a 10-minute module cache."""
    import time

    if _REGION_CACHE["region"] and time.time() - _REGION_CACHE["ts"] < 600:
        return _REGION_CACHE["region"]
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{settings.MEDUSA_URL}/store/regions")
            resp.raise_for_status()
            regions = resp.json().get("regions") or []
            if not regions:
                return None
            region = regions[0]
            _REGION_CACHE.update({"region": region, "ts": time.time()})
            return region
    except (httpx.HTTPError, ValueError):
        return None


async def _get_cart_id(memory_key: str) -> Optional[str]:
    if _redis_client is None:
        return None
    try:
        raw = await _redis_client.get(f"chat:cart:{memory_key}")
        return raw if raw else None
    except Exception:
        return None


async def _set_cart_id(memory_key: str, cart_id: str) -> None:
    if _redis_client is None:
        return
    try:
        await _redis_client.set(f"chat:cart:{memory_key}", cart_id, ex=7 * 24 * 3600)
    except Exception:
        return


async def _clear_cart(memory_key: str) -> None:
    if _redis_client is None:
        return
    try:
        await _redis_client.delete(f"chat:cart:{memory_key}")
    except Exception:
        return


def _cart_summary(cart: dict) -> dict:
    items = cart.get("items") or []
    return {
        "cart_id": cart.get("id"),
        "items": [
            {
                "title": it.get("title"),
                "quantity": it.get("quantity"),
                "unit_price": it.get("unit_price"),
                "thumbnail": it.get("thumbnail"),
                "product_id": (it.get("variant") or {}).get("product_id"),
            }
            for it in items
        ],
        "item_count": sum((it.get("quantity") or 0) for it in items),
        "subtotal": cart.get("subtotal"),
        "total": cart.get("total"),
        "currency": (cart.get("region") or {}).get("currency_code"),
        "email": cart.get("email"),
        "has_shipping_address": bool(cart.get("shipping_address")),
    }


async def _medusa_cart_get(cart_id: str) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{settings.MEDUSA_URL}/store/carts/{cart_id}")
            resp.raise_for_status()
            return resp.json().get("cart")
    except (httpx.HTTPError, ValueError):
        return None


async def _create_cart(memory_key: str, email: Optional[str] = None) -> Optional[dict]:
    region = await _get_default_region()
    if not region:
        return None
    body: dict = {"region_id": region["id"]}
    if email:
        body["email"] = email
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{settings.MEDUSA_URL}/store/carts", json=body)
            resp.raise_for_status()
            cart = resp.json().get("cart")
            if cart:
                await _set_cart_id(memory_key, cart["id"])
            return cart
    except (httpx.HTTPError, ValueError):
        return None


async def _resolve_variant_id(product_id: str) -> Optional[str]:
    """First purchasable variant of a product (by id, or by handle search)."""
    if not product_id:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.MEDUSA_URL}/store/products/{product_id}",
                params={"expand": "variants"},
            )
            if resp.status_code == 404:
                resp = await client.get(
                    f"{settings.MEDUSA_URL}/store/products",
                    params={"handle": product_id, "limit": 1, "expand": "variants"},
                )
            resp.raise_for_status()
            data = resp.json()
            products = data.get("products")
            if products is None:
                products = [data.get("product") or {}]
            if not products:
                return None
            p = products[0] or {}
            variants = p.get("variants") or []
            if not variants:
                return None
            return variants[0].get("id")
    except (httpx.HTTPError, ValueError):
        return None
    return None


async def _add_to_cart(memory_key: str, product_id: str, quantity: int) -> Optional[dict]:
    variant_id = await _resolve_variant_id(product_id)
    if not variant_id:
        return None
    cart_id = await _get_cart_id(memory_key)
    cart = await _medusa_cart_get(cart_id) if cart_id else None
    if not cart:
        cart = await _create_cart(memory_key)
        if not cart:
            return None
        cart_id = cart.get("id")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.MEDUSA_URL}/store/carts/{cart_id}/line-items",
                json={"variant_id": variant_id, "quantity": quantity},
            )
            resp.raise_for_status()
            return resp.json().get("cart")
    except (httpx.HTTPError, ValueError):
        return None


async def _prepare_order(memory_key: str, details: dict) -> tuple:
    """Attach customer + address, pick shipping, and open a payment session.

    Returns (cart, error_message). Does NOT complete the cart — completing is
    the caller's job so the confirmation guard stays in one place.
    """
    cart_id = await _get_cart_id(memory_key)
    cart = await _medusa_cart_get(cart_id) if cart_id else None
    if not cart:
        return None, "No cart found. Add products to the cart first."
    if not (cart.get("items")):
        return cart, "Cart is empty — add products before placing an order."

    email = (details.get("email") or "").strip()
    first = (details.get("first_name") or "").strip()
    last = (details.get("last_name") or "").strip()
    phone = (details.get("phone") or "").strip()
    address_1 = (details.get("address_1") or "").strip()
    city = (details.get("city") or "").strip()
    postal = (details.get("postal_code") or "").strip()
    missing = []
    if not email:
        missing.append("email")
    if not (first or last):
        missing.append("full name")
    if not phone:
        missing.append("phone number")
    elif not re.fullmatch(r"\d{10}", phone.replace("+91", "").replace(" ", "").strip()):
        missing.append("valid 10-digit phone number")
    if not (address_1 and city):
        missing.append("delivery address (street and city)")
    if not postal:
        missing.append("PIN/postal code")
    if missing:
        return cart, f"Missing details before placing the order: {', '.join(missing)}."

    async with httpx.AsyncClient(timeout=12.0) as client:
        # 1) email + shipping address
        try:
            resp = await client.post(
                f"{settings.MEDUSA_URL}/store/carts/{cart_id}",
                json={
                    "email": email,
                    "shipping_address": {
                        "first_name": first or "Guest",
                        "last_name": last,
                        "phone": phone,
                        "address_1": address_1,
                        "address_2": (details.get("address_2") or "").strip(),
                        "city": city,
                        "province": (details.get("province") or "").strip(),
                        "postal_code": postal,
                        "country_code": (details.get("country_code") or "in").lower(),
                    },
                },
            )
            resp.raise_for_status()
            cart = resp.json().get("cart")
        except (httpx.HTTPError, ValueError):
            return cart, "Could not save the delivery address — please try again or use the normal checkout."

        # 2) cheapest shipping method (when the region has options)
        try:
            opts = await client.get(f"{settings.MEDUSA_URL}/store/shipping-options/{cart_id}")
            options = (opts.json().get("shipping_options") or []) if opts.status_code == 200 else []
            if options:
                best = min(options, key=lambda o: o.get("amount") or 0)
                await client.post(
                    f"{settings.MEDUSA_URL}/store/carts/{cart_id}/shipping-methods",
                    json={"option_id": best.get("id")},
                )
        except (httpx.HTTPError, ValueError):
            pass  # shipping selection is optional when the region has no options

        # 3) open payment sessions, then prefer Cash on Delivery
        try:
            await client.post(f"{settings.MEDUSA_URL}/store/carts/{cart_id}/payment-sessions")
        except (httpx.HTTPError, ValueError):
            pass
        providers = [
            p.get("id") for p in ((cart or {}).get("region") or {}).get("payment_providers") or []
        ]
        if not providers:
            providers = ["manual", "stripe"]
        provider = (
            "manual"
            if "manual" in providers
            else ("stripe" if "stripe" in providers else (providers[0] if providers else "manual"))
        )
        try:
            await client.post(
                f"{settings.MEDUSA_URL}/store/carts/{cart_id}/payment-session",
                json={"provider_id": provider},
            )
        except (httpx.HTTPError, ValueError):
            pass

    final = await _medusa_cart_get(cart_id)
    return (final or cart), None


async def _place_order(memory_key: str, details: dict) -> dict:
    """Complete a prepared cart into a real order (COD) or return a checkout link."""
    cart, error = await _prepare_order(memory_key, details)
    if error:
        return {"status": "error", "message": error}
    if not cart or not (cart.get("items")):
        return {"status": "error", "message": "Cart is empty — add products before placing an order."}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{settings.MEDUSA_URL}/store/carts/{cart.get('id')}/complete"
            )
            resp.raise_for_status()
            data = resp.json()
        if data.get("type") == "order":
            order = data.get("data") or {}
            await _clear_cart(memory_key)
            return {
                "status": "order_placed",
                "order_id": order.get("id"),
                "display_id": order.get("display_id"),
                "total": order.get("total"),
                "message": f"Order {order.get('display_id')} placed successfully.",
            }
        # Online payment required → hand off to the normal checkout
        return {
            "status": "payment_required",
            "cart_id": cart.get("id"),
            "checkout_url": "/checkout",
            "message": "Online payment is needed — the customer can complete it on the checkout page.",
        }
    except (httpx.HTTPError, ValueError):
        return {
            "status": "error",
            "message": "The order could not be completed — please try again or use the normal checkout.",
        }


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

LANGUAGE (very important):
- By default reply in Hinglish — Hindi words written in ROMAN/Latin script mixed with English, like a friendly Indian shopkeeper. Examples: "Bhai, aapke liye kuch badhiya options nikali hain.", "Ye stereo aapki Swift ke liye perfect hai.", "Kis budget me chahiye?" NEVER use Devanagari script unless the customer writes in Devanagari.
- If the customer asks for English ("in english", "english me batao", "speak english"), reply in clear English.
- If the customer writes in Hindi (Devanagari script), reply in Devanagari Hindi.
- Match the customer's tone; be warm but never pushy.

WHAT YOU SELL: Floor Mats, LED Lights, Seat Covers, Dash Cameras, Android/Infotainment Systems (car stereos, speakers, amplifiers), Alloy Wheels, Roof Rails, Body Covers, Steering Covers, Mud Flaps, Car Perfume, Mobile Holders, Reverse Cameras, Sun Film, Door Visors, Horns, Flooring/Lamination, Armrests, Ambient Lights.

HOW TO HELP:
1. Understand exactly what they need (product type, car model, budget). If the request is vague, ask ONE short clarifying question (e.g. "Kis budget me chahiye?" or "Stereo, speaker ya amplifier — kya chahiye?"). If it's clear, search right away — don't over-ask.
2. Use the search_products tool with the EXACT product type the customer named (e.g. "bluetooth speaker", "alloy wheels", "dash camera"). NEVER widen to a whole category like "accessories", and NEVER include the car model in the query — the product is what matters.
3. Always search before recommending — never invent product names, prices, or links.
4. After search_products returns, the product cards are shown to the customer automatically. Recommend the specific products by name (title + price) directly in your reply. NEVER invent or guess product names, prices, or stock — only mention what the search actually returned. If the customer gave a budget (e.g. 'under 10000', '10k', '15k tak'), only mention products priced within it — never suggest anything above their budget. If there is no exact match or nothing fits the budget (empty results), say honestly that the item isn't available within that price and mention the cheapest option if any, or suggest 2-3 alternative categories. It is strictly forbidden to describe products that were not in the search results.
5. If the customer asks how a product would look on their car (with or without a photo), call generate_mockup with a clear description of the product to visualize.
6. For shipping, delivery, returns/refunds, COD, warranty, installation, payment or tracking questions, call get_store_policy and answer from it — do NOT escalate for these. Only call escalate_to_human for order-status issues you can't resolve, complaints, or when the customer explicitly wants a human.
7. For a greeting, welcome them warmly in Hinglish and suggest 2-3 popular categories.
8. FITMENT (you can be specific!): When the customer names their car (e.g. "Maruti Swift 2022"), call check_fitment to confirm what fits. Search results are tagged with fits=true (compatible with their car) or fits=false (NOT compatible); universal products fit every car. Only say "aapki car ke liye fit hai" when the fitment data confirms it — never guess. If their car isn't found, say so honestly and point to the site's vehicle selector.
9. You REMEMBER this customer: earlier turns include their car, budget, and past questions. Use that context naturally (e.g. "Swift ke liye pehle speakers dekhe the — ab amplifier chahiye?"). Never ask again for something they already told you.
10. When asked to compare products, give a short side-by-side of the REAL products from the search results (name, price, and one key feature each) — never invent specs or prices.

ORDERS (you can act for the customer):
- The customer's cart persists for the whole conversation (and across visits when they're signed in). Use create_cart, add_to_cart, view_cart, and place_order.
- When the customer asks to buy/add something ("add karo", "le lo", "order karo", "ye product chahiye", "ye add karna hai"), add it to the cart with add_to_cart IMMEDIATELY in the same turn — search it if needed, then add it. Do not stop after searching or ask "should I add it?". Only ask a question when you genuinely cannot tell which product they mean.
- To place the order you MUST first collect and confirm: the customer's full name, phone number, email, and complete delivery address (house/street, city, state, PIN). Ask for missing pieces with ONE short question at a time.
- Only call place_order with confirmed=true after the customer has EXPLICITLY confirmed the items, quantity, and delivery details. It tries Cash on Delivery first; if online payment is required it returns a checkout link you can hand to the customer.
- Never invent prices or totals — read them from the cart summary.

Keep replies to 1-3 short sentences. Never repeat yourself or restate what you already said."""

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search the Cartunez store for products matching the customer's need. Use the EXACT product type they named (e.g. 'bluetooth speaker', 'alloy wheels') — never the car model, never broad words like 'accessories' or 'car'.",
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
    {
        "type": "function",
        "function": {
            "name": "create_cart",
            "description": "Create (or reuse) the customer's cart. The cart is remembered for the whole conversation.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Add a product to the customer's cart. Pass the exact product_id from a search_products result (quantity defaults to 1).",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "string", "description": "Product id from search_products results"},
                    "quantity": {"type": "integer", "description": "Quantity to add (default 1)"},
                },
                "required": ["product_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "view_cart",
            "description": "Show the customer's current cart: items, quantities, and total.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "place_order",
            "description": "Place the customer's order. FIRST collect and confirm their email, full name, phone, and complete delivery address (street, city, state, PIN) — then call this with confirmed=true only after they explicitly agree. Tries Cash on Delivery first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email": {"type": "string"},
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "phone": {"type": "string"},
                    "address_1": {"type": "string", "description": "House/street address"},
                    "address_2": {"type": "string"},
                    "city": {"type": "string"},
                    "province": {"type": "string", "description": "State"},
                    "postal_code": {"type": "string", "description": "PIN code"},
                    "country_code": {"type": "string", "description": "Default 'in'"},
                    "confirmed": {"type": "boolean", "description": "Must be true — only after the customer confirms items and delivery details"},
                },
                "required": ["confirmed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_fitment",
            "description": "Check what fits the customer's car. Pass the make/model/year (year optional). Without product_id it returns the car's fitment context; with product_id it confirms whether that specific product fits their car. Customers usually name their car naturally (e.g. 'Maruti Swift 2022').",
            "parameters": {
                "type": "object",
                "properties": {
                    "make": {"type": "string", "description": "Car make, e.g. 'Maruti'"},
                    "model": {"type": "string", "description": "Car model, e.g. 'Swift'"},
                    "year": {"type": "integer", "description": "Model year, e.g. 2022"},
                    "product_id": {"type": "string", "description": "Optional product id to confirm fitment"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_store_policy",
            "description": "Get Cartunez policy details (shipping, returns/refunds, COD, warranty, installation, payment, tracking, contact). Use this for these topics instead of escalating.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "One of: shipping, returns, cod, warranty, installation, payment, tracking, contact"},
                },
                "required": ["topic"],
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
                # Some auto-routed models (e.g. gemini) stutter and repeat
                # sentences — a mild penalty keeps replies clean.
                "frequency_penalty": 0.4,
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
    customer_id: Optional[str] = None,
) -> Optional[dict]:
    """Iterative tool-calling loop against an OpenAI-compatible provider.

    Runs completions, executes requested tools, feeds results back, and repeats
    until the model replies with plain text (capped to avoid infinite loops).
    Returns a normalized result dict, or None if the provider is unreachable.
    """
    try:
        messages = [{"role": "system", "content": OPENAI_SYSTEM_PROMPT}]
        # Conversation memory: per-customer when signed in (long-lived), else
        # per-session. Replays recent turns so "this car" / "that speaker" keeps
        # context from earlier — and across visits for signed-in customers.
        memory_key = _memory_key(session_id, customer_id)
        cart_state: dict = {}
        budget = _extract_budget(message)
        history = await _get_history(session_id, customer_id)
        for turn in history:
            messages.append(turn)
        # If the new message is vague ("sabse sasta wala", "uska best"), nudge
        # the model to re-search what the customer asked about earlier.
        if history and _extract_category(message) is None:
            last_user = None
            for turn in reversed(history):
                if turn.get("role") == "user":
                    last_user = turn.get("content")
                    break
            if last_user and last_user != message:
                messages.append(
                    {
                        "role": "system",
                        "content": (
                            f'The customer earlier asked: "{last_user}". If their new message '
                            "refers back to that (e.g. 'the cheapest one', 'uska best wala'), "
                            "call search_products again with that product type — never reply "
                            "from memory or invent products."
                        ),
                    }
                )
        # Structured profile (car/budget/interests) + car fitment context, so
        # the model gets the customer's known facts and can speak about fitment.
        profile = await _get_profile(memory_key)
        profile_bits = []
        if profile.get("car"):
            c = profile["car"]
            label = f"{c.get('make') or ''} {c.get('model') or ''} {c.get('year') or ''}".strip()
            if label:
                profile_bits.append(f"car: {label}")
        if profile.get("budget"):
            profile_bits.append(f"budget: ₹{profile['budget']:,}")
        if profile.get("last_category"):
            profile_bits.append(f"last interest: {profile['last_category']}")
        if profile_bits:
            messages.append(
                {
                    "role": "system",
                    "content": "CUSTOMER PROFILE (from earlier conversations): "
                    + "; ".join(profile_bits)
                    + " — use it when relevant, but confirm anything that seems stale.",
                }
            )
        fit_ctx = await _fitment_context(message, profile, cart_state)
        if fit_ctx and fit_ctx.get("found") and fit_ctx.get("known"):
            messages.append(
                {
                    "role": "system",
                    "content": (
                        f"The customer's car is: {fit_ctx['label']}. Search results will "
                        "tag each product with fits=true (compatible with this car) or "
                        "fits=false (not compatible). Only claim a product fits when "
                        "fits=true — universal products fit every car."
                    ),
                }
            )
        elif fit_ctx and fit_ctx.get("found"):
            messages.append(
                {
                    "role": "system",
                    "content": (
                        f"The customer's car is: {fit_ctx['label']}, but fitment data for "
                        "it isn't available yet. Don't claim anything fits or doesn't fit "
                        "— say fitment can be confirmed on the product page or the site's "
                        "vehicle selector."
                    ),
                }
            )
        elif fit_ctx:
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "The customer mentioned a car that wasn't found in the catalog — "
                        "say so honestly and suggest the site's vehicle selector."
                    ),
                }
            )
        messages.append({"role": "user", "content": _build_user_content(message, image_data_url)})

        # Iterative tool loop: run a completion, execute any requested tools,
        # feed the results back, and repeat until the model answers in plain
        # text (capped so a tool-happy model can't spin forever). Three rounds
        # give room for the typical search -> add_to_cart -> answer sequence.
        MAX_TOOL_ROUNDS = 3
        search_query: Optional[str] = None
        mockup_subject: Optional[str] = None
        handoff_reason: Optional[str] = None
        handoff: bool = False
        last_products: List[ProductCard] = []
        fetched: dict[str, ProductCard] = {}
        reply_text = ""

        last_tool_sig: Optional[str] = None
        for round_index in range(MAX_TOOL_ROUNDS + 1):
            # After the tool rounds, drop the tools so the model MUST answer in
            # plain text instead of looping tool calls forever.
            tools = OPENAI_TOOLS if round_index < MAX_TOOL_ROUNDS else None
            resp = await _llm_chat_completion(provider, messages, tools=tools)
            if not resp:
                return None
            msg = resp["choices"][0]["message"]
            # Models often write a conversational preamble alongside a tool
            # call ("Bhai, options nikalta hoon!") — keep the latest text so
            # the final answer stays natural even if the last round is empty.
            content = (msg.get("content") or "").strip()
            if content:
                reply_text = content
            tool_calls = msg.get("tool_calls") or []
            if not tool_calls:
                break

            # A routed model sometimes re-runs the SAME search over and over
            # (ignoring the results it already has). Stop the loop on a
            # consecutive duplicate so we answer from the results we've got.
            if len(tool_calls) == 1 and last_tool_sig and last_tool_sig == _tool_sig(tool_calls[0]):
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
                    last_products = await _search_medusa(q, limit=5, max_price=budget)
                    products_out = [
                        {
                            "id": p.id,
                            "title": p.title,
                            "handle": p.handle,
                            "price": p.price,
                            "thumbnail": p.thumbnail,
                            "variant_id": p.variant_id,
                        }
                        for p in last_products
                    ]
                    if fit_ctx and fit_ctx.get("found") and fit_ctx.get("known"):
                        for d, p in zip(products_out, last_products):
                            d["fits"] = p.id in fit_ctx["fit_ids"]
                    result = {
                        "products": products_out,
                        "count": len(last_products),
                        "note": "If the list is empty, tell the customer honestly and suggest alternatives.",
                    }
                    if fit_ctx:
                        if fit_ctx.get("found") and fit_ctx.get("known"):
                            result["fitment"] = {
                                "car": fit_ctx["label"],
                                "note": "Each product has fits=true (confirmed compatible with the customer's car) or fits=false (NOT compatible). Universal products fit every car.",
                            }
                        elif fit_ctx.get("found"):
                            result["fitment"] = {
                                "car": fit_ctx["label"],
                                "note": "Fitment data for this car isn't available yet — don't claim fits, point to the product page / vehicle selector.",
                            }
                        else:
                            result["fitment"] = {
                                "car": "unknown",
                                "note": "The customer's car was not found in the catalog — say so and suggest the vehicle selector.",
                            }
                    if budget:
                        result["budget_note"] = (
                            f"The customer's budget is ₹{budget:,}. Only recommend products priced at or below "
                            "that — if none fit, say honestly that nothing is available within that budget."
                        )
                elif name == "fetch_product_by_handle":
                    handle = args.get("handle", "")
                    detail = await _fetch_medusa_product(handle)
                    if detail:
                        fetched[handle] = ProductCard(
                            id=handle,
                            title=detail["title"],
                            handle=handle,
                            price=detail["price"],
                            description=detail["description"],
                            thumbnail=detail["thumbnail"],
                        )
                    result = detail or {"error": "product not found"}
                elif name == "generate_mockup":
                    mockup_subject = args.get("subject") or message
                    result = {"status": "image_generation_started", "subject": mockup_subject}
                elif name == "escalate_to_human":
                    handoff = True
                    handoff_reason = args.get("reason") or "Customer requested human support"
                    result = {"status": "handoff_confirmed"}
                elif name == "create_cart":
                    cart = await _create_cart(memory_key)
                    if cart:
                        cart_state["cart_id"] = cart.get("id")
                        s = _cart_summary(cart)
                        if s.get("item_count"):
                            cart_state["checkout_url"] = "/checkout"
                    result = _cart_summary(cart) if cart else {"error": "Could not create a cart right now."}
                elif name == "add_to_cart":
                    qty = max(1, int(args.get("quantity") or 1))
                    cart = await _add_to_cart(memory_key, str(args.get("product_id") or ""), qty)
                    if cart:
                        cart_state["added"] = True
                        cart_state["cart_id"] = cart.get("id")
                        s = _cart_summary(cart)
                        if s.get("item_count"):
                            cart_state["checkout_url"] = "/checkout"
                        result = s
                    else:
                        result = {
                            "error": "add_failed",
                            "message": "Could not add that product — use a product_id from search_products results.",
                        }
                elif name == "view_cart":
                    cid = await _get_cart_id(memory_key)
                    cart = await _medusa_cart_get(cid) if cid else None
                    if cart:
                        cart_state["cart_id"] = cart.get("id")
                        s = _cart_summary(cart)
                        if s.get("item_count"):
                            cart_state["checkout_url"] = "/checkout"
                        result = s
                    else:
                        result = {
                            "error": "cart_empty",
                            "message": "The cart is empty — suggest products and add them first.",
                        }
                elif name == "place_order":
                    if not args.get("confirmed"):
                        result = {
                            "status": "needs_confirmation",
                            "message": "Confirm the items, quantity, and delivery details (full name, phone, complete address, email) with the customer, then call place_order with confirmed=true.",
                        }
                    else:
                        placed = await _place_order(memory_key, args)
                        if placed.get("status") == "order_placed":
                            cart_state["added"] = True
                            cart_state["order_id"] = placed.get("order_id")
                            cart_state.pop("checkout_url", None)
                        elif placed.get("checkout_url"):
                            cart_state["added"] = True
                            cart_state["checkout_url"] = placed.get("checkout_url")
                            cart_state["cart_id"] = placed.get("cart_id")
                        result = placed
                elif name == "check_fitment":
                    car = {
                        "make": ((args.get("make") or "").strip() or None),
                        "model": ((args.get("model") or "").strip() or None),
                        "year": args.get("year"),
                    }
                    if not (car.get("make") or car.get("model")):
                        car = _extract_vehicle(message)
                    product_id = (args.get("product_id") or "").strip()
                    if product_id:
                        fit = await _fitment_for_car(
                            car.get("make") if car else None,
                            car.get("model") if car else None,
                            car.get("year") if car else None,
                        )
                        if not fit:
                            result = {
                                "status": "car_not_found",
                                "message": "Car not found in the catalog — ask the customer to double-check make/model/year or use the site's vehicle selector.",
                            }
                        elif not fit.get("known"):
                            result = {
                                "status": "unknown",
                                "message": f"Fitment data for {fit['make']} {fit['model']} {fit['year']} isn't available yet — don't claim it fits or doesn't fit; suggest the product page or the site's vehicle selector.",
                            }
                        else:
                            fit_ids = set(fit["compatible_ids"]) | set(fit["universal_ids"])
                            fits = product_id in fit_ids
                            universal = product_id in fit_ids and product_id in set(fit["universal_ids"])
                            result = {
                                "status": "checked",
                                "product_id": product_id,
                                "fit": "fits" if fits else "not_fit",
                                "car": f"{fit['make']} {fit['model']} {fit['year']}".strip(),
                                "note": (
                                    "Universal product — fits every car."
                                    if universal
                                    else ("Confirmed compatible with this car." if fits else "This product is NOT compatible with this car — do not recommend it.")
                                ),
                            }
                    else:
                        if not car:
                            result = {
                                "status": "need_car",
                                "message": "Ask the customer for their car's make and model (year optional) before checking fitment.",
                            }
                        else:
                            fit = await _fitment_for_car(
                                car.get("make"), car.get("model"), car.get("year")
                            )
                            if not fit:
                                result = {
                                    "status": "car_not_found",
                                    "message": f"'{car.get('make') or ''} {car.get('model') or ''} {car.get('year') or ''}' was not found in the catalog — ask the customer to double-check or use the site's vehicle selector.",
                                }
                            elif not fit.get("known"):
                                result = {
                                    "status": "unknown",
                                    "message": f"Fitment data for {fit['make']} {fit['model']} {fit['year']} isn't available yet — tell the customer fitment can be confirmed on the product page or the site's vehicle selector.",
                                }
                            else:
                                # remember the canonical car so later searches are tagged
                                cart_state["car"] = {
                                    "make": fit.get("make"),
                                    "model": fit.get("model"),
                                    "year": fit.get("year"),
                                }
                                fit_ctx = await _fitment_context(message, profile, cart_state)
                                result = {
                                    "status": "found",
                                    "car": f"{fit['make']} {fit['model']} {fit['year']}".strip(),
                                    "compatible_product_ids": fit["compatible_ids"],
                                    "universal_product_ids": fit["universal_ids"],
                                    "note": "search_products results are tagged fits=true/false for this car. Universal products fit every car.",
                                }
                elif name == "get_store_policy":
                    topic = args.get("topic") or ""
                    result = {
                        "topic": topic or "general",
                        "policy": _policy_lookup(topic),
                        "note": "Paraphrase this in Hinglish, warmly, and offer next steps (e.g. contact info for any issue).",
                    }
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
            # Remember this round's tool call so a consecutive duplicate (a
            # routed model re-running the same search) breaks the loop.
            last_tool_sig = _tool_sig(tool_calls[-1]) if tool_calls else None
        # The final (no-tools) round always breaks with a reply; the fallbacks
        # below cover empty/garbage text just in case.

        # Claude sometimes leaks tool-call narration into the reply
        # ('Tool Call: search_products(query=...)', 'Tool #1\ntool_name: …\ntool_input: …',
        # or '**call search_products** with query: ...') — strip function-call
        # fragments and cut any trailing tool-call talk.
        reply_text = re.sub(r"tool call:?\s*[a-z_0-9]+\s*\([^)]*\)", "", reply_text, flags=re.IGNORECASE)
        reply_text = re.sub(
            r"(?is)tool\s*#?\s*\d+[^\n]*\ntool_input\s*:\s*\{.*?\}",
            "",
            reply_text,
            count=1,
        )
        reply_text = re.sub(r"(?im)^\s*tool\s*#?\s*\d+[^\n]*\n?", "", reply_text, count=1)
        m = re.search(
            r"(?i)(\*\*call|call (the )?(search_products|fetch_product_by_handle|generate_mockup|escalate_to_human)|(search_products|fetch_product_by_handle)\(|call_[a-z_0-9]*|(action|tool|function|search(?:es|ing)?\s+(?:products?|items?))\s*:|(?:tool|function)\s+call\s*:|\*\s*(searches?|searching|fetches?|finding|generates?))",
            reply_text,
        )
        if m:
            reply_text = reply_text[: m.start()].rstrip(" ,.!:;*")
        # Strip leftover narration fragments the cut may have left behind
        # ("🔍Auto-", "**Sear...", "auto-searching for:").
        reply_text = re.sub(
            r"🔍[a-z-]*|\bauto[- ]?search[a-z]*|\*+\s*[a-z]{1,6}\s*$",
            "",
            reply_text,
            flags=re.IGNORECASE,
        )
        # Collapse stutter/restating, then exact duplicates and stray artifacts.
        reply_text = _dedupe_sentences(reply_text)
        # If the customer wrote in Latin script, drop any Devanagari sentences
        # the model leaked (some routed models drift into Hindi script).
        if not re.search("[\u0900-\u097f]", message):
            _parts = re.split(r"(?<=[.!?])\s+", reply_text)
            reply_text = " ".join(p for p in _parts if not re.search("[\u0900-\u097f]", p))
        if reply_text and reply_text[: len(reply_text) // 2] == reply_text[len(reply_text) // 2 :]:
            reply_text = reply_text[: len(reply_text) // 2].strip()
        reply_text = re.sub(r"\[\s*\]|\{\s*\}", "", reply_text)
        reply_text = re.sub(r"\s+", " ", reply_text).strip()

        # Generate mockup image if requested (or if the user clearly asked for a visual)
        image_url: Optional[str] = None
        if mockup_subject or _wants_mockup(message):
            car_image = _decode_image(image_data_url) if image_data_url else None
            image_provider = _resolve_image_provider()
            if image_provider:
                image_url = await _llm_generate_mockup(image_provider, mockup_subject or message, car_image)

        # Product cards for the UI: reuse the last search, else keyword fallback
        products: List[ProductCard] = list(last_products)
        if not products:
            # Re-run the search directly (never widen to a whole category — that
            # dumps unrelated products like screen activators for 'subwoofer').
            q = search_query or message
            products = await _search_medusa(q, limit=5, max_price=budget)

        # ── GUARANTEED ADD ──────────────────────────────────────────────────
        # If the customer asked to add/buy something and neither the model nor
        # an earlier turn built a cart, add the best-matching product ourselves
        # so ordering works even when the routed model stalls on searches.
        if (
            not cart_state.get("added")
            and not handoff
            and not _wants_handoff(message)
            and _extract_add_intent(message)
            and products
        ):
            best = _pick_best_product(products, search_query or message)
            if best:
                qty = _extract_quantity(message)
                added = await _add_to_cart(memory_key, best.id, qty)
                if added:
                    cart_state["added"] = True
                    cart_state["cart_id"] = added.get("id")
                    cart_state["checkout_url"] = "/checkout"
                    if not reply_text or "options hain" in reply_text:
                        reply_text = f"Done! {best.title[:60]} cart me add kar diya! 🛒"
                    else:
                        note = f" — {best.title[:60]} cart me add kar diya! 🛒"
                        if note not in reply_text:
                            reply_text = (reply_text + note).strip()

        # If the reply names specific products (fetched by handle), put those
        # cards first so the list always matches the text.
        if fetched:
            mentioned = [p for p in fetched.values() if _title_mentioned(reply_text, p.title)]
            if mentioned:
                mentioned_ids = {p.id for p in mentioned}
                products = mentioned + [p for p in products if p.id not in mentioned_ids]
                products = products[:5]

        # Policy questions: answer from the curated policy even if the routed
        # model stalled (it sometimes returns tool narration instead of a reply).
        policy_topic = _detect_policy_topic(message)
        if (
            policy_topic
            and _extract_category(message) is None  # don't hijack product searches
            and ("<|" in reply_text or not reply_text or "exact match nahi mila" in reply_text)
        ):
            reply_text = f"{_policy_lookup(policy_topic)} Aur kuch aur jaan'na ho to batao! 😊"

        # Template artifacts (<|start|>…) or empty replies — build a clean reply
        # from what we actually found; never claim options exist when none do.
        if "<|" in reply_text or not reply_text:
            if products:
                names = ", ".join(p.title for p in products[:3])
                reply_text = f"Yahan {len(products)} options hain: {names}."
            else:
                reply_text = "Abhi store me iska exact match nahi mila. Koi aur product batao — jaise stereo, seat covers ya LED lights — ya human se baat karo."
        elif budget and not products:
            # Budget given but nothing fits: say so honestly and quote the
            # cheapest option (always above the budget here, since any within-
            # budget match would already be in `products`).
            cheapest = await _search_medusa(search_query or message, limit=5)
            cheapest_price = min(
                (v for p in cheapest if (v := _price_to_int(p.price)) is not None),
                default=None,
            )
            if cheapest_price is not None:
                reply_text = (
                    f"Bhai, ₹{budget:,} ke andar iska kuch nahi mila. "
                    f"Sabse sasta option ₹{cheapest_price:,} ka hai — budget thoda upar karein ya koi aur product batao?"
                )
            else:
                reply_text = f"Bhai, ₹{budget:,} ke andar kuch nahi mila. Koi aur product batao, main wahan dekh leta hoon."
        elif not products:
            lower_reply = reply_text.lower()
            # The model sometimes HALLUCINATES products with fake prices when
            # the search is empty — if the reply asserts specific items (₹,
            # "ye rahe", "best selling"), correct it honestly.
            asserts_products = (
                "₹" in reply_text
                or "ye rahe" in lower_reply
                or "ye hain" in lower_reply
                or "available hain" in lower_reply
                or "best selling" in lower_reply
            )
            # Or it promises options ("nikal ke deta hoon") with nothing to
            # show — only rewrite short promise-only replies, never a long
            # substantive answer like a category list or clarifying question.
            promises_only = len(reply_text) < 200 and any(
                h in lower_reply
                for h in (
                    "milen", "milenge", "nikal", "dikhata", "dhundh",
                    "karta hoon", "karti hoon", "karta hain", "karti hain",
                    "deta hoon", "dete hain", "ek minute", "ek second",
                    "turant", "abhi dekh", "check karta",
                )
            )
            if asserts_products or promises_only:
                reply_text = "Bhai, abhi store me iska exact match nahi mila. Koi aur product batao — jaise stereo, seat covers ya LED lights — ya human se baat karo."

        # The model sometimes names products that are NOT in the real cards
        # (invented lists with fake prices) even when products were found —
        # if it quotes a price but names none of the real titles, rebuild the
        # reply from the actual cards.
        if "₹" in reply_text and products and not any(_title_mentioned(reply_text, p.title) for p in products):
            names = ", ".join(p.title for p in products[:3])
            reply_text = f"Yahan {len(products)} options hain: {names}."

        # GUARANTEED FITMENT LINE: when the customer's car is known, always
        # tell them which of the shown products actually fit (the routed model
        # sometimes forgets, and the template fallback strips its fitment talk).
        if fit_ctx and fit_ctx.get("found") and fit_ctx.get("known") and products and "fit" not in reply_text.lower():
            fits_n = sum(1 for p in products if p.id in fit_ctx["fit_ids"])
            label = fit_ctx["label"]
            if fits_n == len(products):
                fit_line = f" — ye sab {label} ke liye fit hain ✓"
            elif fits_n > 0:
                fit_line = f" — inme se {fits_n} aapki {label} ke liye fit hain"
            else:
                fit_line = f" — inme se koi bhi {label} ke liye fit nahi hai, aur options dekhein?"
            if fit_line not in reply_text:
                reply_text = (reply_text + fit_line).strip()

        return {
            "reply": reply_text or "Here's what I found:",
            "products": products,
            "image_url": image_url,
            "handoff": handoff or _wants_handoff(message),
            "handoff_reason": handoff_reason if handoff else None,
            "cart_id": cart_state.get("cart_id"),
            "checkout_url": cart_state.get("checkout_url"),
            "order_id": cart_state.get("order_id"),
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
2. Reply in Hinglish (Roman Hindi + English mix) by default; switch to English if the customer asks for English
3. Provide a helpful, friendly response and suggest relevant product categories

IMPORTANT: Always respond with a JSON object in this exact format:
{
  "reply": "your helpful response text",
  "search_query": "the exact product type the customer asked for (never the car model, never broad words)",
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

    customer_id = (body.customer_id or "").strip() or None
    if customer_id:
        # Chat started before sign-up: fold the anonymous session's turns into
        # the customer's long-lived memory so nothing is lost on account creation.
        await _merge_into_user(body.session_id, customer_id)

    category = _extract_category(message)
    budget = _extract_budget(message)

    # Remember structured facts (car, budget, interests) for future conversations
    _updates: dict = {}
    _car = _extract_vehicle(message)
    if _car and (_car.get("make") or _car.get("model")):
        _updates["car"] = _car
    if budget:
        _updates["budget"] = budget
    if category:
        _updates["last_category"] = category
    if _updates:
        await _save_profile(_memory_key(body.session_id, customer_id), _updates)

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
        llm_result = await _llm_chat_provider(
            provider, message, image_data_url, body.session_id, customer_id
        )

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
            customer_id,
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
                products = await _search_medusa(search_query, limit=5, max_price=budget)
                if not products:
                    products = await _search_medusa("car accessories", limit=5, max_price=budget)
                    reply_text += " Here are some popular items to browse."
                llm_result = {"reply": reply_text, "products": products, "handoff": handoff}

    # 3) Keyword fallback
    if not llm_result:
        search_query = message
        products = await _search_medusa(search_query, limit=5, max_price=budget)
        if not products:
            if budget:
                reply_text = f"Bhai, ₹{budget:,} ke andar abhi kuch nahi mila. Koi aur product ya thoda higher budget batao?"
            else:
                reply_text = random.choice(FALLBACK_RESPONSES)
            products = []  # honest empty — no dumping unrelated products
        else:
            count = len(products)
            if category:
                reply_text = f"Yahan {category} me {count} products mile hain."
            else:
                reply_text = f"Yahan {count} products mile hain."
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

    # Remember the conversation for context on the next turn (long-lived for
    # signed-in customers, per-session for guests)
    await _push_history(
        body.session_id,
        [
            {"role": "user", "content": message},
            {"role": "assistant", "content": reply_text},
        ],
        customer_id=customer_id,
    )

    return ChatReply(
        reply=reply_text,
        products=products,
        actions=actions,
        image_url=image_url,
        handoff=handoff,
        handoff_reason=handoff_reason,
        cart_id=llm_result.get("cart_id"),
        checkout_url=llm_result.get("checkout_url"),
        order_id=llm_result.get("order_id"),
    )
