"""Initial migration - create all tables.

Revision ID: 001_initial
Create Date: 2026-06-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Vehicle Makes
    op.create_table(
        "vehicle_makes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Vehicle Models
    op.create_table(
        "vehicle_models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "make_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("vehicle_makes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False, index=True),
        sa.Column("slug", sa.String(100), nullable=False, index=True),
        sa.Column("body_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Vehicle Years
    op.create_table(
        "vehicle_years",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "model_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("vehicle_models.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("year", sa.Integer, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Vehicle Variants
    op.create_table(
        "vehicle_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "vehicle_year_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("vehicle_years.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("engine", sa.String(100), nullable=True),
        sa.Column("transmission", sa.String(50), nullable=True),
        sa.Column("fuel_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Dealers
    op.create_table(
        "dealers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, index=True),
        sa.Column("slug", sa.String(200), unique=True, nullable=False, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("address", sa.Text, nullable=False),
        sa.Column("city", sa.String(100), nullable=False, index=True),
        sa.Column("state", sa.String(100), nullable=False, index=True),
        sa.Column("zip_code", sa.String(20), nullable=False),
        sa.Column("country", sa.String(100), nullable=False, server_default="US"),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("website", sa.Text, nullable=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("image_url", sa.Text, nullable=True),
        sa.Column("is_verified", sa.Boolean, server_default="false"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Bulk Enquiries
    op.create_table(
        "bulk_enquiries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("contact_name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("vehicle_make", sa.String(100), nullable=True),
        sa.Column("vehicle_model", sa.String(100), nullable=True),
        sa.Column("vehicle_year", sa.Integer, nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("product_ids", sa.Text, nullable=True),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Installation Bookings
    op.create_table(
        "installation_bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dealer_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("customer_email", sa.String(255), nullable=False, index=True),
        sa.Column("customer_phone", sa.String(20), nullable=False),
        sa.Column("vehicle_make", sa.String(100), nullable=False),
        sa.Column("vehicle_model", sa.String(100), nullable=False),
        sa.Column("vehicle_year", sa.String(10), nullable=False),
        sa.Column("vehicle_vin", sa.String(17), nullable=True),
        sa.Column("preferred_date", sa.String(20), nullable=True),
        sa.Column("preferred_time", sa.String(20), nullable=True),
        sa.Column("service_type", sa.String(100), nullable=False),
        sa.Column("product_ids", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Leads
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("vehicle_make", sa.String(100), nullable=True),
        sa.Column("vehicle_model", sa.String(100), nullable=True),
        sa.Column("vehicle_year", sa.String(10), nullable=True),
        sa.Column("product_interest", sa.String(200), nullable=True),
        sa.Column("source", sa.String(50), nullable=False, server_default="website"),
        sa.Column("medium", sa.String(50), nullable=True),
        sa.Column("campaign", sa.String(100), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="new"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Support Tickets
    op.create_table(
        "support_tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("customer_email", sa.String(255), nullable=False, index=True),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="general"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(50), nullable=False, server_default="open"),
        sa.Column("assigned_to", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Support Messages
    op.create_table(
        "support_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "ticket_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("support_tickets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sender_name", sa.String(200), nullable=False),
        sa.Column("sender_email", sa.String(255), nullable=False),
        sa.Column("is_staff", sa.Boolean, server_default="false"),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Blog Categories
    op.create_table(
        "blog_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Blog Tags
    op.create_table(
        "blog_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("slug", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Blog Authors
    op.create_table(
        "blog_authors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), unique=True, nullable=False, index=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Blogs
    op.create_table(
        "blogs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False, index=True),
        sa.Column("slug", sa.String(300), unique=True, nullable=False, index=True),
        sa.Column("excerpt", sa.Text, nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("featured_image", sa.Text, nullable=True),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blog_authors.id"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blog_categories.id"),
            nullable=True,
        ),
        sa.Column("is_published", sa.Boolean, server_default="false"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Blog Post Tags (association table)
    op.create_table(
        "blog_post_tags",
        sa.Column(
            "blog_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blogs.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blog_tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    # Reviews
    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", sa.String(100), nullable=False, index=True),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("customer_email", sa.String(255), nullable=False),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("title", sa.String(300), nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("is_verified_purchase", sa.Boolean, server_default="false"),
        sa.Column("is_approved", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Page Views
    op.create_table(
        "page_views",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("path", sa.String(500), nullable=False, index=True),
        sa.Column("referrer", sa.Text, nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("session_id", sa.String(100), nullable=True, index=True),
        sa.Column("visitor_id", sa.String(100), nullable=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Conversion Events
    op.create_table(
        "conversion_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(50), nullable=False, index=True),
        sa.Column("session_id", sa.String(100), nullable=True),
        sa.Column("visitor_id", sa.String(100), nullable=True),
        sa.Column("revenue", sa.String(20), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("metadata", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("conversion_events")
    op.drop_table("page_views")
    op.drop_table("reviews")
    op.drop_table("blog_post_tags")
    op.drop_table("blogs")
    op.drop_table("blog_authors")
    op.drop_table("blog_tags")
    op.drop_table("blog_categories")
    op.drop_table("support_messages")
    op.drop_table("support_tickets")
    op.drop_table("leads")
    op.drop_table("installation_bookings")
    op.drop_table("bulk_enquiries")
    op.drop_table("dealers")
    op.drop_table("vehicle_variants")
    op.drop_table("vehicle_years")
    op.drop_table("vehicle_models")
    op.drop_table("vehicle_makes")
