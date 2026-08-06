"""Instagram Reels endpoint.

Sources, in priority order:
1. INSTAGRAM_SHORTCODES  — curated comma-separated shortcodes (manual, always wins)
2. INSTAGRAM_ACCESS_TOKEN — official Instagram Graph API (automatic, freshest)
3. Auto-discovery from the profile /reels/ page (anonymous scrape)
4. FALLBACK_SHORTCODES   — last-resort stale list (Instagram now login-walls
   anonymous scrapers, so discovery often returns nothing)

Each reel is normalized to {id, shortcode, url, thumbnail, caption, likes}.
Results are cached in memory for 30 minutes.
"""

import asyncio
import html as html_mod
import logging
import os
import re
import time
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/social", tags=["social"])
log = logging.getLogger(__name__)

INSTAGRAM_PROFILE = os.getenv("INSTAGRAM_PROFILE", "cartunez_hyd")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
REEL_BASE_URL = f"https://www.instagram.com/{INSTAGRAM_PROFILE}/reel/"

# Official Graph API token (optional). When set, reels come from
# https://graph.instagram.com/me/media — fresh, no scraping, no login wall.
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "").strip()

# Curated shortcodes (optional, highest priority). Comma-separated — accept
# either bare codes (DZpunZWOoXM) or full shared links
# (https://www.instagram.com/reel/DZpunZWOoXM/).
_INSTAGRAM_SHORTCODES_RAW = os.getenv("INSTAGRAM_SHORTCODES", "")


def _parse_shortcodes(raw: str) -> list[str]:
    """Parse a comma-separated list of bare shortcodes or full reel URLs."""
    codes: list[str] = []
    for part in raw.split(","):
        part = part.strip().strip()
        if not part:
            continue
        if "instagram.com" in part:
            code = part.rstrip("/").rsplit("/", 1)[-1].split("?", 1)[0]
            if len(code) >= 10:
                codes.append(code)
        else:
            codes.append(part)
    return codes


INSTAGRAM_SHORTCODES: list[str] = _parse_shortcodes(_INSTAGRAM_SHORTCODES_RAW)

# Fallback shortcodes (used only if every other source fails)
FALLBACK_SHORTCODES: list[str] = [
    "DZpunZWOoXM", "DZplvOeMYtv", "DZfLj2HMXHr", "DZfJah6MiPf",
    "DZfFUf1Mj3y", "DZfDsZxM4QA", "DZfBKxSOIXu", "DLmv3Q1y8GE",
    "DLmvRhByj0g", "DLh2NPFSalS", "DLCU3d8y3VJ", "DKpjb_nSx2p",
]

# Regexes to extract reel shortcodes from the profile /reels/ page.
# Instagram changes its HTML structure frequently; try several shapes.
REELS_PAGE_RES = [
    re.compile(r'/\"reel\"/([A-Za-z0-9_-]{10,})'),
    re.compile(r'href="/(?:{}/)?reel/([A-Za-z0-9_-]{{10,}})'.format(re.escape(INSTAGRAM_PROFILE))),
    re.compile(r'"code":"([A-Za-z0-9_-]{10,})"'),
    re.compile(r'"shortcode":"([A-Za-z0-9_-]{10,})"'),
]

# In-memory cache
_cache: dict = {"reels": [], "fetched_at": 0.0, "source": ""}
CACHE_TTL = 1800        # 30 minutes for successful fetches
NEGATIVE_CACHE_TTL = 300  # 5-minute cooldown when every source fails

OG_IMG_RE = re.compile(r'og:image"\s+content="([^"]+)"')
OG_TITLE_RE = re.compile(r'og:title"\s+content="([^"]+)"')
OG_DESC_RE = re.compile(r'og:description"\s+content="([^"]+)"')

_CAPTION_PREFIXES = [
    "Car Tunez on Instagram: ",
    "Car Tunez Hyderabad | Premium Car Accessories on Instagram: ",
]


def _clean_caption(text: str) -> str:
    text = html_mod.unescape(text)
    for prefix in _CAPTION_PREFIXES:
        if text.startswith(prefix):
            text = text[len(prefix):]
    text = text.strip('"').strip("'")
    text = re.sub(r"^\d+ likes?, \d+ comments? - .*?:\s*", "", text)
    lines = [l.strip() for l in text.split("\n") if l.strip() and not l.strip().startswith("#")]
    return "\n".join(lines[:4])


async def _discover_shortcodes(client: httpx.AsyncClient) -> list[str]:
    """Scrape the Instagram profile /reels/ page to discover current reel shortcodes."""
    profile_url = f"https://www.instagram.com/{INSTAGRAM_PROFILE}/reels/"
    try:
        resp = await client.get(profile_url, headers={"User-Agent": USER_AGENT}, follow_redirects=True)
        if resp.status_code != 200:
            log.warning("Profile page returned %d", resp.status_code)
            return []
        for pattern in REELS_PAGE_RES:
            codes = list(dict.fromkeys(pattern.findall(resp.text)))
            if codes:
                log.info("Auto-discovered %d reel shortcodes from profile", len(codes))
                return codes[:12]
        log.warning("No shortcodes found in profile page HTML")
        return []
    except Exception as e:
        log.warning("Failed to discover shortcodes from profile: %s", e)
        return []


async def _fetch_graph_api_reels(client: httpx.AsyncClient) -> list[dict]:
    """Fetch reels from the official Instagram Graph API (needs a token)."""
    url = "https://graph.instagram.com/me/media"
    params = {
        "fields": "id,caption,media_type,permalink,thumbnail_url,timestamp",
        "limit": "25",
        "access_token": INSTAGRAM_ACCESS_TOKEN,
    }
    try:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            log.warning("Graph API returned %d: %s", resp.status_code, resp.text[:200])
            return []
        data = resp.json()
        if data.get("error"):
            log.warning("Graph API error: %s", data["error"])
            return []
        reels: list[dict] = []
        for media in data.get("data", []):
            if media.get("media_type") not in ("REELS", "VIDEO"):
                continue
            permalink = media.get("permalink", "")
            shortcode = permalink.rstrip("/").rsplit("/", 1)[-1] if permalink else ""
            if not shortcode:
                continue
            reels.append({
                "id": shortcode,
                "shortcode": shortcode,
                "url": permalink or f"{REEL_BASE_URL}{shortcode}/",
                "thumbnail": media.get("thumbnail_url") or "",
                "caption": _clean_caption(media.get("caption") or ""),
                "likes": 0,
            })
        log.info("Graph API returned %d reels", len(reels))
        return reels
    except Exception as e:
        log.warning("Failed to fetch reels from Graph API: %s", e)
        return []


async def _fetch_reel_oembed(client: httpx.AsyncClient, shortcode: str) -> Optional[dict]:
    """Fetch a reel via Instagram's public oEmbed endpoint (no login wall).

    Returns the video frame thumbnail + caption in one small JSON call.
    """
    url = f"{REEL_BASE_URL}{shortcode}/"
    oembed_url = f"https://www.instagram.com/api/v1/oembed/?url={url}"
    try:
        resp = await client.get(oembed_url, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            return None
        data = resp.json()
        thumbnail = html_mod.unescape(data.get("thumbnail_url") or "")
        if not thumbnail:
            return None
        return {
            "id": shortcode,
            "shortcode": shortcode,
            "url": url,
            "thumbnail": thumbnail,
            "caption": _clean_caption(data.get("title") or ""),
            "likes": 0,
        }
    except Exception as e:
        log.warning("oEmbed failed for reel %s: %s", shortcode, e)
        return None


async def _fetch_reel(client: httpx.AsyncClient, shortcode: str) -> Optional[dict]:
    """Fetch a single reel. oEmbed first, then fall back to og: tag scraping."""
    oembed = await _fetch_reel_oembed(client, shortcode)
    if oembed:
        return oembed

    url = f"{REEL_BASE_URL}{shortcode}/"
    try:
        resp = await client.get(url, headers={"User-Agent": USER_AGENT}, follow_redirects=True)
        if resp.status_code != 200:
            log.warning("Reel %s returned status %d", shortcode, resp.status_code)
            return None

        page = resp.text
        img_match = OG_IMG_RE.search(page)
        if not img_match:
            log.warning("Reel %s: no og:image found (page length %d)", shortcode, len(page))
            return None

        thumbnail = html_mod.unescape(img_match.group(1))

        title_match = OG_TITLE_RE.search(page)
        desc_match = OG_DESC_RE.search(page)

        caption = ""
        if title_match:
            caption = _clean_caption(title_match.group(1))
        elif desc_match:
            caption = _clean_caption(desc_match.group(1))

        likes = 0
        if desc_match:
            likes_m = re.search(r"(\d+) likes?", desc_match.group(1))
            if likes_m:
                likes = int(likes_m.group(1))

        return {
            "id": shortcode,
            "shortcode": shortcode,
            "url": url,
            "thumbnail": thumbnail,
            "caption": caption,
            "likes": likes,
        }
    except Exception as e:
        log.warning("Failed to fetch reel %s: %s", shortcode, e)
        return None


async def _fetch_reels_from_shortcodes(client: httpx.AsyncClient, shortcodes: list[str]) -> list[dict]:
    sem = asyncio.Semaphore(4)

    async def _limited(sc: str):
        async with sem:
            result = await _fetch_reel(client, sc)
            await asyncio.sleep(0.3)
            return result

    results = await asyncio.gather(*[_limited(sc) for sc in shortcodes])
    return [r for r in results if r is not None]


def _response(reels: list[dict], source: str, cached: bool) -> dict:
    return {
        "reels": reels,
        "source": source,
        "cached": cached,
        "count": len(reels),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/instagram/reels")
async def get_instagram_reels():
    """Get Instagram reels with thumbnails and captions (cached 30 min)."""
    now = time.time()

    # Return cache if fresh (successful fetch)
    if _cache["reels"] and (now - _cache["fetched_at"]) < CACHE_TTL:
        return _response(_cache["reels"], _cache["source"], cached=True)

    # Short cooldown for total failures so a broken source isn't re-scraped
    # on every homepage request
    if not _cache["reels"] and _cache["fetched_at"] and (now - _cache["fetched_at"]) < NEGATIVE_CACHE_TTL:
        return _response([], _cache["source"] or "none", cached=True)

    source = "fallback"
    reels: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        if INSTAGRAM_SHORTCODES:
            # 1. Curated env list — explicit user control
            source = "env"
            reels = await _fetch_reels_from_shortcodes(client, INSTAGRAM_SHORTCODES[:12])
        elif INSTAGRAM_ACCESS_TOKEN:
            # 2. Official Graph API — automatic and fresh
            source = "graph_api"
            reels = await _fetch_graph_api_reels(client)
        else:
            # 3. Anonymous scrape of the profile page (often login-walled now)
            shortcodes = await _discover_shortcodes(client)
            if shortcodes:
                source = "scrape"
                reels = await _fetch_reels_from_shortcodes(client, shortcodes)
            else:
                source = "fallback"

        # 4. Last resort: stale fallback list (better than an empty section)
        if not reels:
            if source == "fallback":
                log.error("All reels sources failed (incl. fallback list)")
            else:
                log.warning("No reels from source '%s', falling back to fallback list", source)
            source = "fallback"
            reels = await _fetch_reels_from_shortcodes(client, FALLBACK_SHORTCODES)

    log.info("Fetched %d reels (source=%s)", len(reels), source)

    # Cache both successes and failures (negative cache) so a broken source
    # isn't re-scraped on every homepage load
    _cache["reels"] = reels
    _cache["fetched_at"] = now
    _cache["source"] = source

    return _response(reels, source, cached=False)


@router.post("/instagram/reels/refresh")
async def refresh_reels():
    """Force refresh the reels cache (clears both success and failure caches)."""
    _cache["reels"] = []
    _cache["fetched_at"] = 0.0
    _cache["source"] = ""
    return await get_instagram_reels()
