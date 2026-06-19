"""Blog models for articles, categories, tags, and authors."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

# Association table for blog post tags
blog_post_tags = Table(
    "blog_post_tags",
    Base.metadata,
    Column(
        "blog_id",
        UUID(as_uuid=True),
        ForeignKey("blogs.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("blog_tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class BlogCategory(Base):
    """Blog article category."""

    __tablename__ = "blog_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    posts: Mapped[list["Blog"]] = relationship("Blog", back_populates="category")

    def __repr__(self) -> str:
        return f"<BlogCategory {self.name}>"


class BlogTag(Base):
    """Blog article tag."""

    __tablename__ = "blog_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<BlogTag {self.name}>"


class BlogAuthor(Base):
    """Blog author profile."""

    __tablename__ = "blog_authors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    posts: Mapped[list["Blog"]] = relationship("Blog", back_populates="author")

    def __repr__(self) -> str:
        return f"<BlogAuthor {self.name}>"


class Blog(Base):
    """Blog article."""

    __tablename__ = "blogs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False, index=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    featured_image: Mapped[str | None] = mapped_column(Text, nullable=True)

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blog_authors.id"), nullable=False
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blog_categories.id"), nullable=True
    )

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["BlogAuthor"] = relationship("BlogAuthor", back_populates="posts")
    category: Mapped["BlogCategory | None"] = relationship(
        "BlogCategory", back_populates="posts"
    )
    tags: Mapped[list["BlogTag"]] = relationship("BlogTag", secondary=blog_post_tags)

    def __repr__(self) -> str:
        return f"<Blog {self.title}>"
