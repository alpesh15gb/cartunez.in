"""Pydantic schemas for blog models."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BlogCategoryCreate(BaseModel):
    """Schema for creating a blog category."""

    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    description: Optional[str] = None


class BlogCategoryResponse(BaseModel):
    """Schema for blog category response."""

    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogTagCreate(BaseModel):
    """Schema for creating a blog tag."""

    name: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=50)


class BlogTagResponse(BaseModel):
    """Schema for blog tag response."""

    id: UUID
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogAuthorCreate(BaseModel):
    """Schema for creating a blog author."""

    name: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class BlogAuthorResponse(BaseModel):
    """Schema for blog author response."""

    id: UUID
    name: str
    slug: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogCreate(BaseModel):
    """Schema for creating a blog post."""

    title: str = Field(..., max_length=300)
    slug: str = Field(..., max_length=300)
    excerpt: Optional[str] = None
    content: str
    featured_image: Optional[str] = None
    author_id: UUID
    category_id: Optional[UUID] = None
    tag_ids: List[UUID] = []
    is_published: bool = False


class BlogResponse(BaseModel):
    """Schema for blog post response."""

    id: UUID
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    featured_image: Optional[str] = None
    author_id: UUID
    category_id: Optional[UUID] = None
    is_published: bool
    published_at: Optional[datetime] = None
    author: Optional[BlogAuthorResponse] = None
    category: Optional[BlogCategoryResponse] = None
    tags: List[BlogTagResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
