import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, text
from app.database import async_session_factory
from app.models.blog import Blog, BlogAuthor, BlogCategory, BlogTag
from app.models.review import Review
from app.models.gallery import GalleryItem

# Medusa Product IDs
PRODUCT_MATS = "prod_01KVBW6GE1D0PG4ZV7QHSG3Y34"
PRODUCT_SEATS = "prod_01KVBW6GK2Z4D2E63F1NTX2S53"
PRODUCT_LEDS = "prod_01KVBW6GP1T8Q4A6ZY0T7CNGPM"
PRODUCT_STEREO = "prod_01KVBW6GS1S3XA8Z9X4RTHBBVP"
PRODUCT_DASHCAM = "prod_01KVBW6GWKDAWHSPG3AWPJD3D5"

async def seed_data():
    print("Connecting to database...")
    async with async_session_factory() as session:
        # Create gallery_items table if not exists
        print("Ensuring gallery_items table exists...")
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS gallery_items (
                id UUID PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                image VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                vehicle VARCHAR(100) NOT NULL
            )
        """))
        await session.commit()

    # Re-open session for transaction work
    async with async_session_factory() as session:
        # 1. Seed Blog Categories
        categories = {
            "Buying Guide": BlogCategory(name="Buying Guide", slug="buying-guide", description="Expert buying advice for selecting car parts and accessories."),
            "DIY Guide": BlogCategory(name="DIY Guide", slug="diy-guide", description="Step-by-step DIY installation guides for vehicle accessories."),
            "Lists": BlogCategory(name="Lists", slug="lists", description="Top curated lists and collections of must-have products."),
            "Maintenance": BlogCategory(name="Maintenance", slug="maintenance", description="Pro car care tips and maintenance routines.")
        }
        
        for name, cat in list(categories.items()):
            stmt = select(BlogCategory).where(BlogCategory.slug == cat.slug)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                categories[name] = existing
                print(f"Category already exists: {name}")
            else:
                session.add(cat)
                await session.flush()
                print(f"Created category: {name}")

        # 2. Seed Blog Authors
        authors = {
            "Vikram Malhotra": BlogAuthor(
                name="Vikram Malhotra",
                slug="vikram-malhotra",
                bio="Vikram is a veteran automotive journalist with over 15 years of experience reviewing cars and testing accessories.",
                avatar_url="/authors/vikram.jpg"
            ),
            "Rohan Sharma": BlogAuthor(
                name="Rohan Sharma",
                slug="rohan-sharma",
                bio="Rohan is our lead DIY installer and car electronics specialist, focusing on audio and lighting upgrades.",
                avatar_url="/authors/rohan.jpg"
            )
        }

        for name, auth in list(authors.items()):
            stmt = select(BlogAuthor).where(BlogAuthor.name == auth.name)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                authors[name] = existing
                print(f"Author already exists: {name}")
            else:
                session.add(auth)
                await session.flush()
                print(f"Created author: {name}")

        # 3. Seed Blog Tags
        tags = {
            "mats": BlogTag(name="Mats", slug="mats"),
            "lighting": BlogTag(name="Lighting", slug="lighting"),
            "interior": BlogTag(name="Interior", slug="interior"),
            "electronics": BlogTag(name="Electronics", slug="electronics"),
            "dashcam": BlogTag(name="Dashcam", slug="dashcam")
        }

        for name, tag in list(tags.items()):
            stmt = select(BlogTag).where(BlogTag.slug == tag.slug)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                tags[name] = existing
                print(f"Tag already exists: {name}")
            else:
                session.add(tag)
                await session.flush()
                print(f"Created tag: {name}")

        # 4. Seed Blog Posts (matching site homepage expectations)
        posts_data = [
            {
                "title": "Best Car Floor Mats in 2026: Complete Buying Guide",
                "slug": "best-car-floor-mats-2026",
                "excerpt": "Discover the top-rated car floor mats that protect your vehicle interior while enhancing aesthetics.",
                "content": "A premium car deserves premium floor protection. In this comprehensive guide, we review 7D custom floor mats, 3D all-weather mats, and standard rubber mats. We evaluate durability, water resistance, style, and ease of cleaning to help you choose the best fit for your vehicle's cabin.",
                "featured_image": "/blogs/floor-mats-guide.jpg",
                "category": categories["Buying Guide"],
                "author": authors["Vikram Malhotra"],
                "tags": [tags["mats"], tags["interior"]]
            },
            {
                "title": "How to Upgrade Your Car LED Lights: DIY Guide",
                "slug": "car-led-light-upgrade-guide",
                "excerpt": "Step-by-step guide to upgrading your car headlights and tail lights with energy-efficient LEDs.",
                "content": "Upgrading to LED headlights is one of the most effective safety modifications you can make. This DIY guide walks you through choosing CANBUS-compatible bulbs (like the Cartunez HyperLED 130W), accessing your headlight housing, installing the bulbs, and aligning the beam pattern to prevent blinding oncoming traffic.",
                "featured_image": "/blogs/led-lights.jpg",
                "category": categories["DIY Guide"],
                "author": authors["Rohan Sharma"],
                "tags": [tags["lighting"], tags["electronics"]]
            },
            {
                "title": "Top 10 Must-Have Car Accessories in 2026",
                "slug": "top-10-car-accessories-2026",
                "excerpt": "From dash cams to seat covers, here are the essential accessories every car owner needs.",
                "content": "Make your daily commute more comfortable and secure. We outline the top 10 automotive accessories for 2026, including 4K dual dash cams, high-quality Nappa seat covers, custom fit 7D floor mats, and smart touchscreen infotainment units. Enhance your vehicle's resale value and driving pleasure.",
                "featured_image": "/blogs/top-accessories.jpg",
                "category": categories["Lists"],
                "author": authors["Vikram Malhotra"],
                "tags": [tags["interior"], tags["electronics"], tags["dashcam"]]
            }
        ]

        for p_data in posts_data:
            stmt = select(Blog).where(Blog.slug == p_data["slug"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                print(f"Blog post already exists: {p_data['title']}")
            else:
                new_post = Blog(
                    title=p_data["title"],
                    slug=p_data["slug"],
                    excerpt=p_data["excerpt"],
                    content=p_data["content"],
                    featured_image=p_data["featured_image"],
                    category_id=p_data["category"].id,
                    author_id=p_data["author"].id,
                    is_published=True,
                    published_at=datetime.now(timezone.utc)
                )
                # Link tags
                for t in p_data["tags"]:
                    new_post.tags.append(t)
                session.add(new_post)
                print(f"Created blog post: {p_data['title']}")

        # 5. Seed Reviews
        reviews_data = [
            # 7D Floor Mats
            {
                "product_id": PRODUCT_MATS,
                "customer_name": "Aravind Swamy",
                "customer_email": "aravind@gmail.com",
                "rating": 5,
                "title": "Unbelievable quality and perfect fit!",
                "content": "Installed this in my Baleno. The fitting is exceptionally tight and doesn't slide around at all. The dual-layer grass mat design makes it very easy to clean dirt and spills. Worth every rupee!",
                "is_verified_purchase": True,
                "is_approved": True
            },
            {
                "product_id": PRODUCT_MATS,
                "customer_name": "Meera Sen",
                "customer_email": "meera.sen@yahoo.com",
                "rating": 4,
                "title": "Very premium, easy to clean",
                "content": "Excellent coverage. Only issue is it took about 4 days to customize and deliver, but the product quality makes up for it. Highly recommended for premium interiors.",
                "is_verified_purchase": True,
                "is_approved": True
            },
            # Nappa Seat Covers
            {
                "product_id": PRODUCT_SEATS,
                "customer_name": "Rahul Verma",
                "customer_email": "rahul.verma@outlook.com",
                "rating": 5,
                "title": "Feels like an expensive sports car luxury interior!",
                "content": "The leather feels extremely soft and premium. Got the dual-tone Tan & Black for my Creta. The bucket fit is so perfect that it looks like original factory seats. Memory foam padding is super comfortable.",
                "is_verified_purchase": True,
                "is_approved": True
            },
            # HyperLED headlight bulbs
            {
                "product_id": PRODUCT_LEDS,
                "customer_name": "Karan Johar",
                "customer_email": "karan@gmail.com",
                "rating": 5,
                "title": "Insanely bright, massive visibility upgrade!",
                "content": "Upgraded from stock yellow halogen bulbs to these 130W LEDs on my Swift. The night driving visibility has improved by at least 200%. High beam throw is brilliant, and clean cut-off line prevents blinding oncoming drivers.",
                "is_verified_purchase": True,
                "is_approved": True
            },
            # 9-inch Android stereo
            {
                "product_id": PRODUCT_STEREO,
                "customer_name": "Siddharth Malhotra",
                "customer_email": "sid@live.in",
                "rating": 4,
                "title": "Smooth performance, great audio output",
                "content": "The DSP chip really changes the sound quality of stock speakers. Apple CarPlay connects wirelessly within 5 seconds of starting the car. Screen touch is very responsive. Highly satisfied.",
                "is_verified_purchase": True,
                "is_approved": True
            },
            # Dual Channel Dashcam
            {
                "product_id": PRODUCT_DASHCAM,
                "customer_name": "Priya Nair",
                "customer_email": "priya.nair@gmail.com",
                "rating": 5,
                "title": "Lifesaver! Super clear 4K video",
                "content": "The video quality is excellent, and license plates are clearly visible even at night. Dual-channel recording gives complete peace of mind. Installed with the parking kit and it works flawlessly.",
                "is_verified_purchase": True,
                "is_approved": True
            }
        ]

        for r_data in reviews_data:
            stmt = select(Review).where(
                Review.product_id == r_data["product_id"],
                Review.customer_email == r_data["customer_email"]
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                print(f"Review already exists from: {r_data['customer_name']}")
            else:
                new_review = Review(**r_data)
                session.add(new_review)
                print(f"Created review from: {r_data['customer_name']}")

        # 6. Seed Gallery Items
        gallery_items_data = [
            { "title": "Premium 7D Floor Mat Installation", "category": "Interior", "vehicle": "Maruti Swift", "image": "/images/categories/floor-mats.jpg" },
            { "title": "Custom Nappa Leather Seat Cover", "category": "Interior", "vehicle": "Hyundai i20", "image": "/images/categories/seat-covers.jpg" },
            { "title": "HyperLED Headlight Upgrade", "category": "LED Lighting", "vehicle": "Tata Nexon", "image": "/images/products/headlights.jpg" },
            { "title": "9-inch Android Car Stereo Setup", "category": "Audio Systems", "vehicle": "Kia Seltos", "image": "/images/products/infotainment.jpg" },
            { "title": "Full Body Kit Installation", "category": "Exterior", "vehicle": "Honda City", "image": "/images/services/accessories.jpg" },
            { "title": "Ceramic Coating Application", "category": "Paint Protection", "vehicle": "Toyota Fortuner", "image": "/images/services/detailing.jpg" },
            { "title": "Ambient Lighting Installation", "category": "LED Lighting", "vehicle": "MG Hector", "image": "/images/categories/ambient-lights.jpg" },
            { "title": "Dual-Channel Dash Camera Setup", "category": "Interior", "vehicle": "Volkswagen Taigun", "image": "/images/products/dashcam.jpg" },
            { "title": "Speaker System Upgrade", "category": "Audio Systems", "vehicle": "Skoda Kushaq", "image": "/images/categories/audio-systems.jpg" },
            { "title": "Steering Cover Installation", "category": "Interior", "vehicle": "Renault Kiger", "image": "/images/services/interior.jpg" },
            { "title": "Roof Rack Installation", "category": "Exterior", "vehicle": "Mahindra Thar", "image": "/images/services/accessories.jpg" },
            { "title": "PPF Application", "category": "Paint Protection", "vehicle": "Ford EcoSport", "image": "/images/services/detailing.jpg" }
        ]

        for item in gallery_items_data:
            stmt = select(GalleryItem).where(GalleryItem.title == item["title"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                print(f"Gallery item already exists: {item['title']}")
            else:
                new_item = GalleryItem(
                    id=uuid.uuid4(),
                    title=item["title"],
                    category=item["category"],
                    vehicle=item["vehicle"],
                    image=item["image"]
                )
                session.add(new_item)
                print(f"Created gallery item: {item['title']}")

        await session.commit()
        print("FastAPI Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
