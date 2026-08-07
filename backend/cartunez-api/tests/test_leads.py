"""Tests for the lead API endpoints."""

from httpx import AsyncClient

import pytest


@pytest.mark.asyncio
async def test_create_lead_public(client: AsyncClient):
    """Public lead creation works without an API key."""
    response = await client.post(
        "/api/v1/leads",
        json={
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "vehicle_year": "2020",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john@example.com"
    assert data["source"] == "website"
    assert data["status"] == "new"


@pytest.mark.asyncio
async def test_create_lead_validation_error(client: AsyncClient):
    """Lead creation with invalid email returns 422."""
    response = await client.post(
        "/api/v1/leads",
        json={},  # missing required name and email
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_leads_requires_api_key(client: AsyncClient):
    """Listing all leads requires an API key."""
    response = await client.get("/api/v1/leads")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_leads_with_api_key(client: AsyncClient, db_session, admin_headers):
    """With an API key, leads can be listed."""
    from app.models import Lead

    lead = Lead(name="Test User", email="test@example.com")
    db_session.add(lead)
    await db_session.flush()

    response = await client.get("/api/v1/leads", headers=admin_headers)
    assert response.status_code == 200
    leads = response.json()
    assert len(leads) == 1
    assert leads[0]["name"] == "Test User"


@pytest.mark.asyncio
async def test_update_lead_status(client: AsyncClient, db_session, admin_headers):
    """Lead status can be updated with an API key."""
    from app.models import Lead

    lead = Lead(name="Test User", email="test@example.com", status="new")
    db_session.add(lead)
    await db_session.flush()

    response = await client.patch(
        f"/api/v1/leads/{lead.id}/status?status=contacted",
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "contacted"


@pytest.mark.asyncio
async def test_update_lead_status_invalid_value(client: AsyncClient, admin_headers):
    """Invalid status value returns 422."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.patch(
        f"/api/v1/leads/{fake_id}/status?status=invalid_status",
        headers=admin_headers,
    )
    assert response.status_code == 422
