"""Support ticket API routes with message management."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.support import SupportMessage, SupportTicket
from app.schemas.support import (
    SupportMessageCreate,
    SupportMessageResponse,
    SupportTicketCreate,
    SupportTicketResponse,
)

router = APIRouter(prefix="/support", tags=["support"])


@router.get("/tickets", response_model=List[SupportTicketResponse])
async def list_tickets(
    status: str = Query("open", max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[SupportTicket]:
    """List support tickets filtered by status."""
    result = await db.execute(
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .where(SupportTicket.status == status)
        .order_by(SupportTicket.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().unique().all()


@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
) -> SupportTicket:
    """Get a support ticket with messages."""
    result = await db.execute(
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/tickets", response_model=SupportTicketResponse, status_code=201)
async def create_ticket(
    data: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
) -> SupportTicket:
    """Create a new support ticket with an optional initial message."""
    ticket = SupportTicket(
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        subject=data.subject,
        category=data.category,
        priority=data.priority,
    )
    db.add(ticket)
    await db.flush()

    if data.initial_message:
        msg = SupportMessage(
            ticket_id=ticket.id,
            sender_name=data.customer_name,
            sender_email=data.customer_email,
            is_staff=False,
            content=data.initial_message,
        )
        db.add(msg)
        await db.flush()

    await db.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}/status", response_model=SupportTicketResponse)
async def update_ticket_status(
    ticket_id: str,
    status: str = Query(..., max_length=50),
    db: AsyncSession = Depends(get_db),
) -> SupportTicket:
    """Update the status of a support ticket."""
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = status
    await db.flush()
    await db.refresh(ticket)
    return ticket


@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=SupportMessageResponse,
    status_code=201,
)
async def add_message(
    ticket_id: str,
    data: SupportMessageCreate,
    db: AsyncSession = Depends(get_db),
) -> SupportMessage:
    """Add a message to a support ticket."""
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_name=data.sender_name,
        sender_email=data.sender_email,
        is_staff=data.is_staff,
        content=data.content,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


@router.get(
    "/tickets/{ticket_id}/messages",
    response_model=List[SupportMessageResponse],
)
async def list_messages(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
) -> List[SupportMessage]:
    """List all messages for a support ticket."""
    result = await db.execute(
        select(SupportMessage)
        .where(SupportMessage.ticket_id == ticket_id)
        .order_by(SupportMessage.created_at.asc())
    )
    return result.scalars().all()
