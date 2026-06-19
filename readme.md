You are a Principal Solution Architect, Senior Full Stack Engineer, Senior UI/UX Designer, DevOps Engineer, SEO Specialist, and E-commerce Product Manager.



Build a complete production-grade automotive e-commerce platform similar in quality to Cartunez with a premium modern UI, mobile-first responsive design, high performance, SEO optimization, and enterprise-level architecture.



DO NOT generate placeholder implementations.

DO NOT generate mock APIs.

DO NOT generate dummy inventory logic.

DO NOT hardcode sample data.

ALL functionality must be production ready.



====================================================

PROJECT OVERVIEW

====================================================



Brand Name: Cartunez



Domains:



Main Website:

https://cartunez.in



Store:

https://shop.cartunez.in



Architecture:



Frontend Website:

Next.js 15

TypeScript

TailwindCSS

Shadcn UI



Storefront:

Next.js 15

TypeScript

TailwindCSS

Shadcn UI

MedusaJS Storefront SDK



Commerce Engine:

MedusaJS Latest Stable



Custom Business APIs:

FastAPI



Database:

PostgreSQL



Search:

Meilisearch



Cache:

Redis



Storage:

S3 Compatible Storage



Containerization:

Docker

Docker Compose



Reverse Proxy:

System Level Nginx (NOT nginx inside docker)



SSL:

Let's Encrypt



OS:

Ubuntu 24.04 LTS



====================================================

ARCHITECTURE

====================================================



Create:



cartunez-website/

cartunez-storefront/

cartunez-medusa/

cartunez-api/

postgres/

redis/

meilisearch/



Communication Flow:



Website

↓

Storefront



Storefront

↓

Medusa API



Storefront

↓

FastAPI



FastAPI

↓

PostgreSQL



Medusa

↓

PostgreSQL



Medusa

↓

Meilisearch



Storefront

↓

Meilisearch



====================================================

MAIN WEBSITE

cartunez.in

====================================================



Purpose:

Brand Website + SEO + Lead Generation



Pages:



Home

About Us

Why Choose Us

Services

Car Accessories

Brands

Installation Services

Blogs

Gallery

Testimonials

Contact Us

Dealer Enquiry

Bulk Purchase

Privacy Policy

Terms

Shipping Policy

Return Policy



====================================================

HOME PAGE DESIGN

====================================================



Premium Automotive Theme



Hero Section



Large Banner

Luxury automotive visuals

CTA buttons



Shop Now

Book Installation



Features Section



100% Genuine Products

Fast Shipping

Easy Returns

Professional Installation



Popular Categories



Seat Covers

Android Players

Dash Cameras

Ambient Lights

Floor Mats

Speakers

Subwoofers

Alloy Wheels

Car Perfumes

Cleaning Accessories



Top Brands Section



Customer Reviews



Installation Gallery



FAQ Section



Latest Blogs



Footer



====================================================

STORE

shop.cartunez.in

====================================================



Purpose:

Full Ecommerce Platform



Pages:



Homepage

Category Listing

Sub Category Listing

Product Listing

Product Detail

Brand Listing

Brand Detail

Cart

Checkout

Wishlist

Order Success

My Account

My Orders

Track Order

Returns

Support



====================================================

PRODUCT SYSTEM

====================================================



Support:



Simple Products



Variable Products



Color Variants



Vehicle Variants



Universal Fit Products



Multiple Images



Video Support



360 Degree Images



PDF Manuals



Installation Guides



Vehicle Compatibility



Compatible Make



Compatible Model



Compatible Year



Compatible Variant



====================================================

INVENTORY MANAGEMENT

====================================================



Track:



SKU



Barcode



HSN Code



Brand



Supplier



Warehouse



Purchase Cost



Selling Price



MRP



GST Rate



Opening Stock



Current Stock



Reserved Stock



Available Stock



Reorder Level



Low Stock Alerts



Stock Movement History



Batch Tracking



Inventory Adjustments



Stock Audit



====================================================

VEHICLE COMPATIBILITY

====================================================



Create database for:



Maruti Suzuki



Hyundai



Tata



Mahindra



Toyota



Honda



Kia



MG



Skoda



Volkswagen



Renault



Nissan



Force



Jeep



Store:



Brand

Model

Year

Variant



Allow:



Find Accessories For My Car



Select Brand

Select Model

Select Year



Show Compatible Products



====================================================

SEARCH

====================================================



Use Meilisearch



Instant Search



Autocomplete



Typo Tolerance



Brand Search



Category Search



Vehicle Search



SKU Search



Voice Search Ready Architecture



====================================================

SEO

====================================================



Implement:



Server Side Rendering



Static Generation



Dynamic Metadata



Structured Data



Schema Markup



Product Schema



Breadcrumb Schema



Review Schema



FAQ Schema



Organization Schema



Article Schema



Open Graph



Twitter Cards



Canonical URLs



XML Sitemap



Robots.txt



Image Optimization



Core Web Vitals



Google Rich Snippets



SEO Friendly URLs



Example:



/seat-covers

/seat-covers/hyundai-creta

/product/hyundai-creta-premium-seat-cover



====================================================

MOBILE OPTIMIZATION

====================================================



Mobile First



Responsive Layout



Bottom Navigation



Sticky Cart



Sticky Buy Now



Touch Friendly Controls



Fast Checkout



PWA Ready



Offline Support Ready



====================================================

CHECKOUT

====================================================



Guest Checkout



Registered Checkout



Address Management



Coupon System



GST Invoice



Business Customer



Shipping Calculation



COD



Online Payment



UPI



Card



Net Banking



Wallet



====================================================

PAYMENTS

====================================================



Integrate:



Razorpay



Webhook Verification



Refund Processing



Payment Logs



Payment Reconciliation



====================================================

CUSTOMER FEATURES

====================================================



Registration



Login



OTP Login



Google Login



Profile



Addresses



Wishlist



Recently Viewed



Order Tracking



Returns



Reviews



Support Tickets



====================================================

ADMIN PANEL

====================================================



Use Medusa Admin



Dashboard



Orders



Products



Categories



Brands



Inventory



Customers



Coupons



Promotions



Returns



Refunds



Analytics



Content Management



SEO Management



====================================================

FASTAPI MODULES

====================================================



Vehicle Compatibility API



Dealer API



Bulk Enquiry API



Installation Booking API



Lead Management API



Support Ticket API



Review Moderation API



Blog API



Analytics API



Dashboard API



====================================================

BLOG SYSTEM

====================================================



SEO Optimized



Categories



Tags



Authors



Related Articles



Rich Text Editor



Schema Markup



Search



====================================================

SECURITY

====================================================



Rate Limiting



JWT Authentication



CSRF Protection



XSS Protection



SQL Injection Protection



Secure Cookies



CORS



Audit Logs



Password Hashing



API Validation



====================================================

PERFORMANCE

====================================================



Lighthouse Score Target



Performance:

95+



SEO:

100



Accessibility:

95+



Best Practices:

100



====================================================

DOCKER DEPLOYMENT

====================================================



Create production ready:



docker-compose.yml



Services:



medusa

fastapi

postgres

redis

meilisearch



Persistent Volumes



Health Checks



Auto Restart



Log Rotation



Environment Variables



====================================================

NGINX CONFIGURATION

====================================================



System Level Nginx



cartunez.in

→ Next.js Website



shop.cartunez.in

→ Next.js Storefront



api.cartunez.in

→ FastAPI



commerce.cartunez.in

→ Medusa



search.cartunez.in

→ Meilisearch Internal Access



SSL



HTTP2



Gzip



Brotli



Cache Headers



Security Headers



====================================================

ANALYTICS

====================================================



Google Analytics



Google Search Console



Microsoft Clarity



Facebook Pixel



Conversion Tracking



Ecommerce Events



====================================================

DELIVERABLES

====================================================



Generate:



1\. Complete system architecture.

2\. Database schema.

3\. PostgreSQL models.

4\. Medusa configuration.

5\. FastAPI backend structure.

6\. Next.js storefront structure.

7\. Main website structure.

8\. Meilisearch integration.

9\. Docker deployment.

10\. Nginx production configs.

11\. SEO implementation.

12\. Inventory workflow.

13\. Order workflow.

14\. Return workflow.

15\. Mobile UX workflow.

16\. Production deployment guide.

17\. CI/CD pipeline.

18\. Backup strategy.

19\. Monitoring strategy.

20\. Scalability plan for 100,000+ products.



Build this as a premium automotive e-commerce platform capable of competing with major Indian automotive accessory stores while remaining maintainable, scalable, mobile-first, SEO optimized, and production ready.

