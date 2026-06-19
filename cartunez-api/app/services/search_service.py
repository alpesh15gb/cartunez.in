"""Search service for Meilisearch integration."""

from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

_client: Optional[httpx.AsyncClient] = None


async def get_client() -> httpx.AsyncClient:
    """Get or create an async HTTP client for Meilisearch."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.MEILISEARCH_HOST,
            headers={"Authorization": f"Bearer {settings.MEILISEARCH_API_KEY}"},
            timeout=10.0,
        )
    return _client


async def close_client() -> None:
    """Close the HTTP client."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


async def index_documents(index_name: str, documents: List[Dict[str, Any]]) -> dict:
    """Index documents into a Meilisearch index."""
    client = await get_client()
    response = await client.post(
        f"/indexes/{index_name}/documents",
        json={"documents": documents},
    )
    response.raise_for_status()
    return response.json()


async def search(
    index_name: str,
    query: str,
    limit: int = 20,
    filters: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search an index and return hits."""
    client = await get_client()
    payload: Dict[str, Any] = {"q": query, "limit": limit}
    if filters:
        payload["filter"] = filters
    response = await client.post(f"/indexes/{index_name}/search", json=payload)
    response.raise_for_status()
    return response.json().get("hits", [])


async def delete_document(index_name: str, document_id: str) -> None:
    """Delete a single document from an index."""
    client = await get_client()
    response = await client.delete(f"/indexes/{index_name}/documents/{document_id}")
    response.raise_for_status()


async def create_index(index_name: str, primary_key: str = "id") -> dict:
    """Create a Meilisearch index."""
    client = await get_client()
    response = await client.post(
        "/indexes",
        json={"uid": index_name, "primaryKey": primary_key},
    )
    if response.status_code == 409:
        return {"status": "index_already_exists"}
    response.raise_for_status()
    return response.json()
