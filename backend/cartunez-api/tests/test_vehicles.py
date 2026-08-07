"""Tests for the vehicle API endpoints."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models import VehicleMake


@pytest.mark.asyncio
async def test_list_makes_empty(client: AsyncClient):
    """Listing makes returns an empty list when no data exists."""
    response = await client.get("/api/v1/vehicles/makes")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_make_requires_api_key(client: AsyncClient):
    """Creating a make without an API key returns 401."""
    response = await client.post(
        "/api/v1/vehicles/makes",
        json={"name": "Toyota", "slug": "toyota"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_make(client: AsyncClient, db_session, admin_headers):
    """Creating a make works with an API key, then listing returns it."""
    response = await client.post(
        "/api/v1/vehicles/makes",
        json={"name": "Toyota", "slug": "toyota"},
        headers=admin_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Toyota"
    assert data["slug"] == "toyota"

    # List and verify
    response = await client.get("/api/v1/vehicles/makes")
    assert response.status_code == 200
    makes = response.json()
    assert len(makes) == 1
    assert makes[0]["name"] == "Toyota"


@pytest.mark.asyncio
async def test_get_make_not_found(client: AsyncClient):
    """Getting a non-existent make returns 404."""
    fake_id = str(uuid4())
    response = await client.get(f"/api/v1/vehicles/makes/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_make_requires_api_key(client: AsyncClient):
    """Deleting a make without an API key returns 401."""
    fake_id = str(uuid4())
    response = await client.delete(f"/api/v1/vehicles/makes/{fake_id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_resolve_vehicle_returns_found(client: AsyncClient, db_session, admin_headers):
    """The resolve endpoint returns vehicle year and variant IDs."""
    # Create make -> model -> year -> variant
    make = VehicleMake(name="Honda", slug="honda")
    db_session.add(make)
    await db_session.flush()

    from app.models import VehicleModel, VehicleYear, VehicleVariant

    model = VehicleModel(make_id=make.id, name="Civic", slug="civic")
    db_session.add(model)
    await db_session.flush()

    year = VehicleYear(model_id=model.id, year=2020)
    db_session.add(year)
    await db_session.flush()

    variant = VehicleVariant(vehicle_year_id=year.id, name="1.5T")
    db_session.add(variant)
    await db_session.flush()

    # Resolve by year_id
    response = await client.get(f"/api/v1/vehicles/resolve?year_id={year.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert data["year_id"] == str(year.id)
    assert len(data["variant_ids"]) == 1

    # Resolve by make/model/year display name
    response = await client.get("/api/v1/vehicles/resolve?make=honda&model=civic&year=2020")
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert data["make"]["name"] == "Honda"

    # Resolve with no match
    response = await client.get("/api/v1/vehicles/resolve?make=nonexistent")
    assert response.status_code == 200
    assert response.json()["found"] is False


@pytest.mark.asyncio
async def test_search_vehicles(client: AsyncClient, db_session):
    """Search endpoint returns matching vehicles."""
    make = VehicleMake(name="Suzuki", slug="suzuki")
    db_session.add(make)
    await db_session.flush()

    from app.models import VehicleModel, VehicleYear

    model = VehicleModel(make_id=make.id, name="Swift", slug="swift", body_type="hatchback")
    db_session.add(model)
    await db_session.flush()

    year = VehicleYear(model_id=model.id, year=2019)
    db_session.add(year)
    await db_session.flush()

    # Search by make name
    response = await client.get("/api/v1/vehicles/search?make=suzuki")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["make"]["name"] == "Suzuki"
    assert results[0]["model"]["name"] == "Swift"
