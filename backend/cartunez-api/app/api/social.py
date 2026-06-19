"""Instagram Reels endpoint — auto-discovers shortcodes, fetches og:image + caption."""

import asyncio
import html as html_mod
import logging
import re
import time
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/social", tags=["social"])
log = logging.getLogger(__name__)

INSTAGRAM_PROFILE = "cartunez_hyd"
USER_AGENT = "Mozilla/5.0"
REEL_BASE_URL = f"https://www.instagram.com/{INSTAGRAM_PROFILE}/reel/"

# Fallback shortcodes (used if profile page scraping fails)
FALLBACK_SHORTCODES: list[str] = [
    "DZpunZWOoXM", "DZplvOeMYtv", "DZfLj2HMXHr", "DZfJah6MiPf",
    "DZfFUf1Mj3y", "DZfDsZxM4QA", "DZfBKxSOIXu", "DLmv3Q1y8GE",
    "DLmvRhByj0g", "DLh2NPFSalS", "DLCU3d8y3VJ", "DKpjb_nSx2p",
]

# Regex to extract reel shortcodes from the profile /reels/ page
REELS_PAGE_RE = re.compile(r'/"reel"/([A-Za-z0-9_-]{10,})')

# In-memory cache
_cache: dict = {"reels": [], "fetched_at": 0.0}
CACHE_TTL = 1800  # 30 minutes

OG_IMG_RE = re.compile(r'og:image"\s+content="([^"]+)"')
OG_TITLE_RE = re.compile(r'og:title"\s+content="([^"]+)"')
OG_DESC_RE = re.compile(r'og:description"\s+content="([^"]+)"')


def _clean_caption(text: str) -> str:
    text = html_mod.unescape(text)
    text = text.replace("Car Tunez on Instagram: ", "").strip('"').strip("'")
    text = re.sub(r"^\d+ likes?, \d+ comments? - .*?:\s*", "", text)
    text = text.replace("&amp;", "&").replace("&#039;", "'").replace("&quot;", '"')
    lines = [l.strip() for l in text.split("\n") if l.strip() and not l.strip().startswith("#")]
    return "\n".join(lines[:4])


async def _discover_shortcodes(client: httpx.AsyncClient) -> list[str]:
    """Scrape the Instagram profile /reels/ page to discover current reel shortcodes."""
    profile_url = f"https://www.instagram.com/{INSTAGRAM_PROFILE}/reels/"
    try:
        resp = await client.get(profile_url, headers={"User-Agent": USER_AGENT}, follow_redirects=True)
        if resp.status_code != 200:
            log.warning("Profile page returned %d", resp.status_code)
            return FALLBACK_SHORTCODES
        shortcodes = list(dict.fromkeys(REELS_PAGE_RE.findall(resp.text)))
        if shortcodes:
            log.info("Auto-discovered %d reel shortcodes from Instagram profile", len(shortcodes))
            return shortcodes[:12]
        log.warning("No shortcodes found in profile page HTML, using fallback")
        return FALLBACK_SHORTCODES
    except Exception as e:
        log.warning("Failed to discover shortcodes from profile: %s", e)
        return FALLBACK_SHORTCODES


async def _fetch_reel(client: httpx.AsyncClient, shortcode: str) -> Optional[dict]:
    """Fetch a single reel page and extract og: tags."""
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


@router.get("/instagram/reels")
async def get_instagram_reels():
    """Get Instagram reels with thumbnails and captions (cached 30 min)."""
    now = time.time()

    # Return cache if fresh
    if _cache["reels"] and (now - _cache["fetched_at"]) < CACHE_TTL:
        return {
            "reels": _cache["reels"],
            "cached": True,
            "count": len(_cache["reels"]),
            "fetched_at": datetime.fromtimestamp(_cache["fetched_at"], tz=timezone.utc).isoformat(),
        }

    # Auto-discover shortcodes from profile page, then fetch each reel
    sem = asyncio.Semaphore(4)
    async with httpx.AsyncClient(timeout=15) as client:
        shortcodes = await _discover_shortcodes(client)
        log.info("Fetching %d reels (auto-discovered: %s)", len(shortcodes), shortcodes != FALLBACK_SHORTCODES)

        async def _limited(sc: str):
            async with sem:
                result = await _fetch_reel(client, sc)
                await asyncio.sleep(0.3)
                return result

        tasks = [_limited(sc) for sc in shortcodes]
        results = await asyncio.gather(*tasks)

    reels = [r for r in results if r is not None]
    log.info("Fetched %d reels from Instagram", len(reels))

    if reels:
        _cache["reels"] = reels
        _cache["fetched_at"] = now

    return {
        "reels": reels or _cache.get("reels", []),
        "cached": False,
        "count": len(reels or _cache.get("reels", [])),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.post("/instagram/reels/refresh")
async def refresh_reels():
    """Force refresh the reels cache."""
    _cache["reels"] = []
    _cache["fetched_at"] = 0.0
    return await get_instagram_reels()
