"""Blog API routes for articles, categories, tags, and authors."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import require_api_key
from app.models.blog import Blog, BlogAuthor, BlogCategory, BlogTag
from app.schemas.blog import (
    BlogAuthorCreate,
    BlogAuthorResponse,
    BlogCategoryCreate,
    BlogCategoryResponse,
    BlogCreate,
    BlogResponse,
    BlogTagCreate,
    BlogTagResponse,
)

router = APIRouter(prefix="/blogs", tags=["blogs"])


# ─── Posts (public read, admin write) ─────────────────────────────────────────

@router.get("/posts", response_model=List[BlogResponse])
async def list_posts(
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    published_only: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[Blog]:
    """List blog posts with optional filters."""
    query = (
        select(Blog)
        .options(selectinload(Blog.author), selectinload(Blog.category), selectinload(Blog.tags))
    )
    if published_only:
        query = query.where(Blog.is_published == True)
    if category_slug:
        query = query.join(BlogCategory).where(BlogCategory.slug == category_slug)
    if tag_slug:
        query = query.join(Blog.tags).where(BlogTag.slug == tag_slug)
    result = await db.execute(
        query.order_by(Blog.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().unique().all()


@router.get("/posts/{slug}", response_model=BlogResponse)
async def get_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Blog:
    """Get a blog post by slug."""
    result = await db.execute(
        select(Blog)
        .options(selectinload(Blog.author), selectinload(Blog.category), selectinload(Blog.tags))
        .where(Blog.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", response_model=BlogResponse, status_code=201)
async def create_post(
    data: BlogCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> Blog:
    """Create a new blog post. Requires API key."""
    tag_ids = data.tag_ids
    post_data = data.model_dump(exclude={"tag_ids"})
    post = Blog(**post_data)

    if tag_ids:
        tags_result = await db.execute(
            select(BlogTag).where(BlogTag.id.in_(tag_ids))
        )
        post.tags = list(tags_result.scalars().all())

    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


@router.patch("/posts/{post_id}", response_model=BlogResponse)
async def update_post(
    post_id: UUID,
    data: BlogCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> Blog:
    """Update a blog post. Requires API key."""
    result = await db.execute(select(Blog).where(Blog.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    for field, value in data.model_dump(exclude={"tag_ids"}).items():
        setattr(post, field, value)

    if data.tag_ids:
        tags_result = await db.execute(
            select(BlogTag).where(BlogTag.id.in_(data.tag_ids))
        )
        post.tags = list(tags_result.scalars().all())

    await db.flush()
    await db.refresh(post)
    return post


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> None:
    """Delete a blog post. Requires API key."""
    result = await db.execute(select(Blog).where(Blog.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)


# ─── Categories (public read, admin write) ────────────────────────────────────

@router.get("/categories", response_model=List[BlogCategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> List[BlogCategory]:
    """List all blog categories."""
    result = await db.execute(select(BlogCategory).order_by(BlogCategory.name))
    return result.scalars().all()


@router.post("/categories", response_model=BlogCategoryResponse, status_code=201)
async def create_category(
    data: BlogCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> BlogCategory:
    """Create a new blog category. Requires API key."""
    category = BlogCategory(**data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


# ─── Tags (public read, admin write) ──────────────────────────────────────────

@router.get("/tags", response_model=List[BlogTagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db),
) -> List[BlogTag]:
    """List all blog tags."""
    result = await db.execute(select(BlogTag).order_by(BlogTag.name))
    return result.scalars().all()


@router.post("/tags", response_model=BlogTagResponse, status_code=201)
async def create_tag(
    data: BlogTagCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> BlogTag:
    """Create a new blog tag. Requires API key."""
    tag = BlogTag(**data.model_dump())
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


# ─── Authors (public read, admin write) ───────────────────────────────────────

@router.get("/authors", response_model=List[BlogAuthorResponse])
async def list_authors(
    db: AsyncSession = Depends(get_db),
) -> List[BlogAuthor]:
    """List all blog authors."""
    result = await db.execute(select(BlogAuthor).order_by(BlogAuthor.name))
    return result.scalars().all()


@router.post("/authors", response_model=BlogAuthorResponse, status_code=201)
async def create_author(
    data: BlogAuthorCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_api_key),
) -> BlogAuthor:
    """Create a new blog author. Requires API key."""
    author = BlogAuthor(**data.model_dump())
    db.add(author)
    await db.flush()
    await db.refresh(author)
    return author
