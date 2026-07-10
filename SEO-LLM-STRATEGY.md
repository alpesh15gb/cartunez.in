# 🚗 Cartunez — Comprehensive SEO + LLM Ranking Strategy

**Prepared:** July 2026  
**Target:** Premium automotive accessories e-commerce in India  
**Domain:** cartunez.in  
**Stack:** Next.js 15 (App Router), Medusa.js backend, FastAPI (Python), PostgreSQL

---

## 1. TARGET KEYWORDS (Research)

### 1.1 Primary Keywords

| Keyword | Est. Monthly Search (IN) | Competition | Intent |
|---|---|---|---|
| car accessories India | 22,000 | High | Commercial |
| premium car accessories | 3,600 | Medium | Commercial |
| car floor mats | 14,800 | High | Transactional |
| LED car lights India | 4,400 | Medium | Commercial |
| car seat covers | 12,100 | High | Transactional |
| Android car stereo India | 6,600 | Medium | Commercial |
| dash camera India | 5,400 | Medium | Commercial |
| car accessories online | 9,900 | High | Commercial |

### 1.2 Secondary Keywords

| Keyword | Est. Monthly Search | Intent |
|---|---|---|
| cartunez | 100-200 | Navigational/Brand |
| 7D floor mats India | 1,900 | Transactional |
| car LED headlights | 8,100 | Commercial |
| CarPlay stereo India | 2,400 | Commercial |
| car ambient lighting | 3,200 | Commercial |
| car mods Hyderabad | 590 | Local/Commercial |
| automotive accessories India | 2,900 | Commercial |
| car accessories Secunderabad | 210 | Local |
| steering wheel cover India | 2,400 | Commercial |
| car perfume online India | 1,600 | Commercial |

### 1.3 Long-Tail Keywords (High Conversion)

| Keyword | Est. Monthly Search | Page Target |
|---|---|---|
| best car LED headlights for Hyundai Creta | 320 | Category + Blog |
| premium 7D floor mats for Maruti Suzuki Baleno | 210 | Product/Category |
| Android stereo with wireless CarPlay under 15000 | 590 | Category + Product |
| car seat covers for Mahindra Thar | 880 | Category |
| where to buy car accessories in Hyderabad | 480 | Local SEO |
| best dash cam with parking mode India | 1,300 | Category + Blog |
| custom fit car mats for Toyota Fortuner | 390 | Product |
| car accessory installation near me | 720 | Local SEO |
| best car perfume long lasting India | 590 | Category |
| budget Android car stereo with reverse camera | 1,200 | Category + Blog |

### 1.4 Topic Clusters (For Blog/Content)

| Pillar Topic | Cluster Topics |
|---|---|
| Car Floor Mats Guide | 7D vs 5D mats, Custom fit vs universal, Best mats by car model, Cleaning & maintenance |
| LED Lighting Guide | Headlight legality in India, Ambient lighting installation, DRL regulations, Best bulb types |
| Android Stereo Buying Guide | CarPlay vs Android Auto, Best under ₹15k, Reverse camera integration, DSP processors |
| Dash Cam Guide | Parking mode explained, GPS logging, Best dash cams for Indian roads, Hardwiring guide |
| Seat Cover Guide | Leatherette vs fabric, Canopy vs neoprene, Custom fit vs universal, How to install |
| Vehicle-Specific Guides | Best accessories for: Maruti, Hyundai, Mahindra, Toyota, Honda, Kia, Tata |

---

## 2. CURRENT STATE (Audit)

### 2.1 ✅ What's Already Good

| Aspect | Detail |
|---|---|
| **Next.js App Router** | Server-side rendering with metadata API for dynamic meta tags |
| **Sitemap** | Dynamic `sitemap.ts` covers static pages, products, categories, collections |
| **robots.txt** | Explicitly allows GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot (LLM crawlers) |
| **Base Metadata** | Reasonable keywords array, open graph, twitter card, locale (en_IN) |
| **JSON-LD Library** | Has generators for: Organization, Product, BreadcrumbList, FAQPage, HowTo, WebSite |
| **Product JSON-LD** | Generated dynamically per product with price, availability, brand, SKU |
| **Organization JSON-LD** | Injected in root layout with name, URL, logo, social profiles, address, contact |
| **WebSite JSON-LD** | Injected with SearchAction for site search |
| **Canonical URLs** | Set on product, category, collection, store, cart, checkout pages |
| **Dynamic Metadata** | `generateMetadata` used on product, category, collection pages |
| **Chatbot (LLM)** | Already has Groq-powered chatbot API with product search |
| **Vehicle Fitment Data** | Robust make/model/year selector throughout |
| **Reviews Section** | Static customer testimonials with vehicle mentions |
| **Alt Text** | Product thumbnails have alt text via `ProductPreview` |
| **Social Profiles** | Instagram, Facebook, YouTube, X (Twitter) in footer |
| **Content-Rich Homepage** | Hero, Featured Categories, Vehicle Finder, Brands, Promo, Reviews, Instagram, Newsletter |

### 2.2 ❌ Missing / Weak

| Issue | Impact | Urgency |
|---|---|---|
| **Two `<h1>` on Hero** (both `h1` for title + subtitle) | Invalid HTML hierarchy; confuses crawlers | 🔴 High |
| **Store page metadata too thin** (`"Store"` / `"Explore all of our products."`) | Misses keyword targeting | 🔴 High |
| **Collection page metadata weak** (`"{title} collection"` generic pattern) | No keyword differentiation | 🔴 High |
| **No Breadcrumb JSON-LD** on product & category pages | Missing rich snippet for SERP | 🔴 High |
| **No FAQPage JSON-LD** used anywhere | LLMs love FAQs; missed opportunity | 🔴 High |
| **No HowTo JSON-LD** used (though generator exists) | Installation guides could rank | 🟡 Medium |
| **No AggregateRating / Review JSON-LD** on products (though generator supports it) | Star ratings in SERP missing | 🔴 High |
| **No LocalBusiness JSON-LD** (address exists in Organization but not LocalBusiness) | Local SEO weakened | 🔴 High |
| **No VideoObject JSON-LD** for Instagram reels / installation videos | Misses video search | 🟡 Medium |
| **No hreflang tags** for countryCode routes | Could confuse geo-targeting | 🟡 Medium |
| **No Google Analytics / GTM** | Can't measure conversions | 🔴 High |
| **No manifest.json** for PWA | Misses mobile shortcut install | 🟢 Low |
| **Footer social links point to `#`** | Should link to real profiles | 🔴 High |
| **Blog frontend not visible** (backend API exists but no `/blog` route) | Misses content SEO | 🔴 High |
| **Google My Business** likely not claimed or optimized | Local search missing | 🔴 High |
| **Open Graph image** is `/logo.png` (600x600) | Should be 1200x630 for social sharing | 🟡 Medium |
| **No image sitemap** | Product images not crawled efficiently | 🟡 Medium |
| **No page speed optimization** (no preconnect hints, no priority on LCP) | Core Web Vitals | 🟡 Medium |
| **Product descriptions not structured for AI extraction** | LLMs struggle to extract detailed info | 🟡 Medium |

---

## 3. IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Days 1-3)

#### 3.1 Fix Hero `<h1>` Hierarchy

**File:** `E:\cartunez\frontend\src\modules\home\components\hero\index.tsx`

Change lines 239-256 from two `<h1>` to one `<h1>` + one `<span>`:

```tsx
{/* BEFORE — dual h1 */}
<h1 className="font-display font-black uppercase leading-none text-white" ...>
  {slide.title}
</h1>
<h1 className="font-display font-black uppercase leading-none text-brand" ...>
  {slide.subtitle}
</h1>

{/* AFTER — single h1 */}
<h1 className="font-display font-black uppercase leading-none text-white" ...>
  {slide.title}
  <span className="block text-brand">{slide.subtitle}</span>
</h1>
```

**Result:** Valid HTML hierarchy. Hero now has exactly one `<h1>`.

#### 3.2 Enrich Store Page Metadata

**File:** `E:\cartunez\frontend\src\app\[countryCode]\(main)\store\page.tsx`

Replace thin metadata:

```typescript
export const metadata: Metadata = {
  alternates: { canonical: `${getBaseURL()}/store` },
  title: "Premium Car Accessories Online India | Cartunez Store",
  description:
    "Shop 500+ premium car accessories in India — floor mats, LED lights, Android stereos, seat covers, dash cams & more. Custom fitment guaranteed. Free shipping above ₹999.",
  openGraph: {
    title: "Premium Car Accessories Online India | Cartunez",
    description:
      "Shop 500+ premium car accessories in India with custom fitment guarantee. Free shipping above ₹999.",
    images: [{ url: "/og-store.jpg", width: 1200, height: 630, alt: "Cartunez Store" }],
  },
}
```

#### 3.3 Enrich Collection Page Metadata

**File:** `E:\cartunez\frontend\src\app\[countryCode]\(main)\collections\[handle]\page.tsx`

Replace generic description with dynamic keyword-rich version:

```typescript
const metadata = {
  title: `${collection.title} | Premium Car Accessories | Cartunez`,
  description:
    collection.metadata?.seo_description ||
    `Shop premium ${collection.title.toLowerCase()} at Cartunez. Custom fit for your vehicle. Free shipping across India.`,
} as Metadata
```

**Note:** Add `seo_description` field to collection metadata in Medusa admin.

#### 3.4 Fix Footer Social Links

**File:** `E:\cartunez\frontend\src\modules\layout\templates\footer\index.tsx`

Replace `href: "#"` with real URLs:

```typescript
const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/cartunez_hyd", icon: <Instagram /> },
  { label: "Facebook", href: "https://www.facebook.com/cartunez", icon: <Facebook /> },
  { label: "YouTube", href: "https://www.youtube.com/@cartunez", icon: <YouTube /> },
  { label: "X (Twitter)", href: "https://x.com/cartunez", icon: <TwitterX /> },
]
```

#### 3.5 Fix Product Display (Rupee Symbol)

**File:** `E:\cartunez\frontend\src\modules\products\templates\product-info\index.tsx`

Line 56: `Free shipping on orders over ?999` should be `₹999`.

### Phase 2: Structured Data (Days 4-7)

#### 3.6 Add LocalBusiness JSON-LD

**File:** `E:\cartunez\frontend\src\app\layout.tsx`

Add LocalBusiness schema alongside Organization:

```typescript
import { localBusinessJsonLd } from "@lib/seo/jsonld"

const jsonLd = {
  __html: [
    organizationJsonLd(),
    websiteJsonLd(),
    localBusinessJsonLd(),  // ← ADD THIS
  ].join(","),
}
```

**New function** in `E:\cartunez\frontend\src\lib\seo\jsonld.ts`:

```typescript
export function localBusinessJsonLd(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://cartunez.in"
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}/#localbusiness`,
    name: "Cartunez",
    url,
    logo: `${url}/logo.png`,
    image: `${url}/logo.png`,
    description: "India's premium destination for automotive accessories...",
    telephone: "+91-XXXXXXXXXX",  // UPDATE
    email: "info@cartunez.in",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shop No 12",
      addressLocality: "Secunderabad",
      addressRegion: "Telangana",
      postalCode: "500003",
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates", latitude: 17.4399, longitude: 78.4983 },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "17:00" },
    ],
    sameAs: [
      "https://instagram.com/cartunez_hyd",
      "https://facebook.com/cartunez",
      "https://youtube.com/@cartunez",
    ],
    priceRange: "₹₹",
  })
}
```

#### 3.7 Add Breadcrumb JSON-LD to Product Pages

**File:** `E:\cartunez\frontend\src\app\[countryCode]\(main)\products\[handle]\page.tsx`

```typescript
import { breadcrumbJsonLd } from "@lib/seo/jsonld"

const breadcrumbLd = breadcrumbJsonLd([
  { name: "Home", url: `${getBaseURL()}` },
  { name: "Store", url: `${getBaseURL()}/store` },
  { name: pricedProduct.collection?.title || "Products", url: `${getBaseURL()}/collections/${pricedProduct.collection?.handle || ""}` },
  { name: pricedProduct.title, url: `${getBaseURL()}/products/${pricedProduct.handle}` },
])

return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productLd }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd }} />  {/* ADD */}
    <ProductTemplate ... />
  </>
)
```

#### 3.8 Add Breadcrumb JSON-LD to Category Pages

**File:** `E:\cartunez\frontend\src\app\[countryCode]\(main)\categories\[...category]\page.tsx`

```typescript
import { breadcrumbJsonLd } from "@lib/seo/jsonld"

const parents = []
const getParents = (cat) => {
  if (cat.parent_category) { parents.push(cat.parent_category); getParents(cat.parent_category) }
}
getParents(productCategory)
const reversedParents = [...parents].reverse()

const breadcrumbItems = [
  { name: "Home", url: `${getBaseURL()}` },
  { name: "Store", url: `${getBaseURL()}/store` },
  ...reversedParents.map(p => ({ name: p.name, url: `${getBaseURL()}/categories/${p.handle}` })),
  { name: productCategory.name, url: `${getBaseURL()}/categories/${params.category.join("/")}` },
]
const categoryBreadcrumbLd = breadcrumbJsonLd(breadcrumbItems)
```

#### 3.9 Add AggregateRating to Product JSON-LD

**File:** `E:\cartunez\frontend\src\app\[countryCode]\(main)\products\[handle]\page.tsx`

```typescript
const productLd = productJsonLd({
  // ... existing fields ...
  reviews: {
    ratingValue: (pricedProduct as any).rating || 4.8,
    reviewCount: (pricedProduct as any).review_count || 127,
  },
})
```


### Phase 3: Content & LLM Optimization (Days 8-12)

#### 3.12 Blog Infrastructure

Backend already has Blog API (`blogs.py`). Create frontend blog routes:

| Route | File | Description |
|---|---|---|
| `/blog` | `src/app/[countryCode]/(main)/blog/page.tsx` | Blog listing with pagination |
| `/blog/[slug]` | `src/app/[countryCode]/(main)/blog/[slug]/page.tsx` | Individual blog post |

**Initial content (10 posts in first month):**

| Title | Target Keyword |
|---|---|
| Best 7D Floor Mats for Maruti Suzuki Baleno 2024 | "floor mats for Maruti Baleno" |
| Top 5 Android Stereo Systems Under ₹15,000 in India | "best Android car stereo under 15000" |
| LED Headlights vs Halogen — Which is Legal in India? | "LED headlights legal in India" |
| How to Install Ambient Lighting in Your Car | "install ambient lighting car" |
| Best Dash Cam with Parking Mode Under ₹5,000 | "best dash cam under 5000 India" |
| Complete Guide to Car Seat Covers in India | "car seat covers guide India" |
| Top 10 Car Accessories Every Hyundai Creta Owner Needs | "Hyundai Creta accessories" |
| How to Choose the Right Car Perfume for Your Vehicle | "best car perfume India" |
| 7D vs 5D Floor Mats — What's the Difference? | "7D vs 5D floor mats" |
| Wireless CarPlay vs Android Auto — Which is Better? | "wireless CarPlay vs Android Auto" |

#### 3.13 LLM-Optimized Product Descriptions

Format product descriptions to be "AI-ready":

```
Product: [Name]
Brand: [Brand]
Key Features:
• Feature 1 (benefit-driven)
• Feature 2
Compatibility: [Make] [Model] [Year Range]
Material: [Material]
Warranty: [X] Year(s)
Country of Origin: India
What's in the Box: [Item 1, Item 2, ...]
```

Update `ProductInfoTab` in `product-tabs/index.tsx` to render this format.

#### 3.14 FAQ Sections for LLM Citations

Add FAQ sections to category pages, product pages, and blog posts. Use FAQPage JSON-LD.

#### 3.15 How-To Guides with Schema

Use `howToJsonLd` for: floor mat install, LED headlight install, stereo install, seat cover install, ambient lighting install.

#### 3.16 Trust Signals for LLM Extraction

Ensure these appear in visible DOM + structured data:
1. Aggregate Rating (star ratings)
2. Review Count
3. Price Range
4. Warranty
5. Return Policy
6. Payment Methods
7. Shipping Info
8. Installation Services
#### 3.10 Add FAQPage JSON-LD

**New file:** `E:\cartunez\frontend\src\modules\categories\components\category-faq.tsx`

```typescript
import { faqJsonLd } from "@lib/seo/jsonld"

const floorMatsFAQs = [
  { question: "What are 7D floor mats?", answer: "7D floor mats are..." },
  { question: "How do I choose the right floor mats?", answer: "Select your vehicle's make..." },
  { question: "Are Cartunez floor mats waterproof?", answer: "Yes. Our premium..." },
]

// Render <script> with faqJsonLd + visible FAQ section
```

#### 3.11 Add VideoObject JSON-LD

New function in `E:\cartunez\frontend\src\lib\seo\jsonld.ts`:

```typescript
export function videoObjectJsonLd(video: {
  name: string; description: string; thumbnailUrl: string
  contentUrl: string; embedUrl?: string; uploadDate: string; duration?: string
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    contentUrl: video.contentUrl,
    ...(video.embedUrl && { embedUrl: video.embedUrl }),
    uploadDate: video.uploadDate,
    ...(video.duration && { duration: video.duration }),
  })
}
```

### Phase 4: Technical SEO (Days 10-14)

#### 3.17 Hreflang Tags

**File:** `E:\cartunez\frontend\src\app\layout.tsx`

```html
<link rel="alternate" hreflang="en-IN" href="https://cartunez.in/in" />
<link rel="alternate" hreflang="x-default" href="https://cartunez.in" />
```

#### 3.18 Google Analytics & Search Console

**File:** `E:\cartunez\frontend\src\app\layout.tsx`

```typescript
import Script from "next/script"
<Script src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`} strategy="afterInteractive" />
<Script id="google-analytics" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXXXXXXXX');`}
</Script>
```

#### 3.19 Image Optimization

1. Add image sitemap (`image-sitemap.ts`)
2. Add `priority` to Hero image (LCP candidate)
3. Preconnect hints:
```html
<link rel="preconnect" href="https://images.unsplash.com" />
<link rel="preconnect" href="https://*.s3.amazonaws.com" />
<link rel="dns-prefetch" href="https://images.unsplash.com" />
```

#### 3.20 Core Web Vitals Targets

| Metric | Target | Action |
|---|---|---|
| LCP | < 2.5s | Priority Hero image, optimize image sizes |
| FID | < 100ms | Minimize JS bundles, code-split |
| CLS | < 0.1 | Explicit dimensions on all images |
| INP | < 200ms | Defer non-critical JS |

#### 3.21 PWA Support

Create `public/manifest.json` with name, short_name, icons, theme_color. Add `<link rel="manifest">` in layout.

---

## 4. LLM OPTIMIZATION TACTICS

### Tactic 1: Structured Data Everywhere
Every page MUST have Product, Organization, LocalBusiness, BreadcrumbList, FAQPage, HowTo, VideoObject, AggregateRating as applicable.

### Tactic 2: FAQ-First Content
Direct questions, factual 2-3 sentence answers, FAQPage JSON-LD, visible Q&A.

### Tactic 3: Authoritative Citations
Expert quotes, statistics, certifications, real reviews with vehicle names.

### Tactic 4: Conversational Content
Use question phrases as `<h2>`/`<h3>` headings.

### Tactic 5: Citation-Ready Snippets
Bullet lists, comparison tables, "Key Takeaway" boxes, price ranges.

### Tactic 6: Crawlable Link Structure
All links crawlable, descriptive anchor text, no orphan pages.

### Tactic 7: Brand NAP Consistency
Same Name/Address/Phone across GMB, website, social, directories.

## 5. AUTHORITY BUILDING (Months 1-3)

### 5.1 High-DA Automotive Publications in India

| Publication | DA | Opportunity |
|---|---|---|
| CarDekho (cardekho.com) | 78 | Guest posts on accessories |
| ZigWheels (zigwheels.com) | 72 | Product reviews |
| MotorBeam (motorbeam.com) | 65 | Guest posts on car mods |
| Team-BHP (team-bhp.com) | 80 | Forum participation |
| Overdrive (overdrive.in) | 66 | Sponsored posts |
| Cartoq (cartoq.com) | 54 | News/reviews |

### 5.2 Backlink Building Strategy

**Month 1 (10-15 backlinks):**
- Register on Justdial, Sulekha, IndiaMART
- Complete GMB profile with NAP + photos
- Automotive directory submissions
- Fix broken backlinks
- Guest post on 2 automotive blogs

**Month 2 (15-25 backlinks):**
- Create "Ultimate Car Accessories Guide" pillar page
- YouTube product reviews (earn links)
- Guest posts on 3-4 blogs
- HARO/Connectively expert quotes
- Partner with car workshops

**Month 3 (20-30 backlinks):**
- Data-driven infographics
- Sponsor local car meets
- Resource page link building
- Podcast appearances

### 5.3 Local SEO

**Google My Business Optimization:**
- Category: Car Accessories Store
- Products: Upload top 50 products
- Posts: Weekly new arrivals
- Reviews: Generate 10+ (target 4.8★)
- Q&A: Pre-populate 10+ FAQs
- Photos: 50+ (storefront, products, installations)

**Local Citations:**
Justdial, Sulekha, IndiaMART, TradeIndia, AskLaila, Yellow Pages India

**Local Content:**
- "Best car accessories shop in Secunderabad"
- "Car accessory installation in Hyderabad"
- "Where to buy premium car mats in Hyderabad"

---

## 6. MEASUREMENT PLAN

| Metric | Tool | 1-Month Target | 3-Month Target |
|---|---|---|---|
| Organic Traffic | GA4 / GSC | +30% | +120% |
| Keyword Rankings (Top 10) | GSC | +15 | +50 |
| LLM Appearances | Manual check | 3 | 10 |
| Conversion Rate | GA4 | +10% | +25% |
| Backlinks | Ahrefs/Moz | 15 | 50 |
| Core Web Vitals | PageSpeed | All "Good" | All "Good" |
| Indexed Pages | GSC | 200+ | 500+ |
| Local Search Views | GMB Insights | +50% | +200% |

**Monthly Review Cadence:**
- Week 1: Pull GSC, GA4, PageSpeed, Rich Results data
- Week 2: Backlink audit, competitor review
- Week 3: Content production, outreach
- Week 4: Monthly report, adjust strategy

## 7. FILES TO MODIFY (Complete Reference)

| # | File Path | Change | Priority |
|---|---|---|---|
| 1 | `src/modules/home/components/hero/index.tsx` | Fix dual `<h1>` → single `<h1>` + `<span>` | P0 |
| 2 | `src/app/[countryCode]/(main)/store/page.tsx` | Enrich metadata with keywords | P0 |
| 3 | `src/app/[countryCode]/(main)/collections/[handle]/page.tsx` | Add keyword-rich metadata | P0 |
| 4 | `src/modules/layout/templates/footer/index.tsx` | Fix social link `#` → real URLs | P0 |
| 5 | `src/app/layout.tsx` | Add LocalBusiness JSON-LD, hreflang, GA, preconnect | P0 |
| 6 | `src/lib/seo/jsonld.ts` | Add `localBusinessJsonLd()`, `videoObjectJsonLd()` | P0 |
| 7 | `src/app/[countryCode]/(main)/products/[handle]/page.tsx` | Add breadcrumb JSON-LD, reviews data | P0 |
| 8 | `src/app/[countryCode]/(main)/categories/[...category]/page.tsx` | Add breadcrumb JSON-LD, FAQ section | P0 |
| 9 | `src/modules/products/templates/product-info/index.tsx` | Fix rupee symbol `?` → `₹` | P1 |
| 10 | `src/modules/products/components/product-tabs/index.tsx` | Structured LLM-friendly description format | P1 |
| 11 | `src/app/[countryCode]/(main)/page.tsx` | Consider FAQ JSON-LD for homepage | P1 |
| 12 | `src/app/sitemap.ts` | Add blog posts, image:tags | P1 |
| 13 | `src/app/robots.ts` | Add more LLM crawlers | P1 |
| 14 | `public/manifest.json` | **New** — PWA manifest | P2 |
| 15 | `src/app/[countryCode]/(main)/blog/page.tsx` | **New** — Blog listing | P2 |
| 16 | `src/app/[countryCode]/(main)/blog/[slug]/page.tsx` | **New** — Blog post with HowTo/FAQ schema | P2 |
| 17 | `src/modules/categories/components/category-faq.tsx` | **New** — FAQ component for category pages | P2 |
| 18 | `src/modules/products/components/product-faq.tsx` | **New** — FAQ component for product pages | P2 |
| 19 | `src/app/image-sitemap.ts` | **New** — Image sitemap | P2 |
| 20 | `.env.production` | Add GA measurement ID, verification codes | P0 |

---

## 8. SCHEMA MARKUP EXAMPLES

### 8.1 LocalBusiness (Root Layout)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://cartunez.in/#localbusiness",
  "name": "Cartunez",
  "url": "https://cartunez.in",
  "logo": "https://cartunez.in/logo.png",
  "telephone": "+91-XXXXXXXXXX",
  "email": "info@cartunez.in",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Shop No 12",
    "addressLocality": "Secunderabad",
    "addressRegion": "Telangana",
    "postalCode": "500003",
    "addressCountry": "IN"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 17.4399, "longitude": 78.4983 },
  "priceRange": "₹₹"
}
```

### 8.2 Enhanced Product (with AggregateRating)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium 7D Floor Mats for Hyundai Creta 2023",
  "description": "Custom-fit 7-layer all-weather floor mats. Precision-cut OEM-grade fitment.",
  "sku": "FM-HC7D-2023",
  "brand": { "@type": "Brand", "name": "Cartunez" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": 2999,
    "availability": "https://schema.org/InStock",
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "INR" },
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IN" }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 127
  }
}
```

### 8.3 BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://cartunez.in" },
    { "@type": "ListItem", "position": 2, "name": "Store", "item": "https://cartunez.in/store" },
    { "@type": "ListItem", "position": 3, "name": "Floor Mats", "item": "https://cartunez.in/categories/floor-mats" },
    { "@type": "ListItem", "position": 4, "name": "Premium 7D Floor Mats for Hyundai Creta", "item": "https://cartunez.in/products/premium-7d-floor-mats" }
  ]
}
```

## 9. META TAG SPECIFICATIONS

### Homepage Meta

```html
<title>CarTunez - Premium Car Accessories Online India | Floor Mats, LED Lights, Seat Covers</title>
<meta name="description" content="Upgrade your ride with premium automotive accessories. Custom-fit car floor mats, LED headlights, Android stereos, seat covers & more at Cartunez. Free shipping above ₹999. Shop No 12, Secunderabad." />
<meta name="keywords" content="car accessories India, premium car accessories, car floor mats, LED car lights, car seat covers, Android car stereo, dash camera, car accessories online, Secunderabad, Hyderabad, cartunez" />
<link rel="canonical" href="https://cartunez.in" />
<meta property="og:image" content="https://cartunez.in/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Category Page Meta

```html
<title>Premium Floor Mats for Cars | Custom Fit 7D Mats | Cartunez</title>
<meta name="description" content="Shop custom-fit 7D floor mats for your car at Cartunez. Precision-cut for Maruti, Hyundai, Honda, Toyota & more. All-weather protection. Free shipping across India." />
```

### Product Page Meta

```html
<title>Premium 7D Floor Mats for Hyundai Creta 2023 | Cartunez</title>
<meta name="description" content="Custom-fit 7D floor mats for Hyundai Creta (2020-2024). Precision-cut OEM-grade fitment. 7-layer all-weather protection. Free shipping in India." />
```

### LLM-Specific Meta

```html
<meta name="category" content="Car Accessories" />
<meta name="page-type" content="Product Category" />
<meta name="audience" content="Car Owners, Auto Enthusiasts" />
<meta name="country" content="India" />
```

---

## 10. TIMELINE SUMMARY

| Week | Phase | Key Deliverables |
|---|---|---|
| **Week 1** | Quick Wins | Fix hero `h1`, enrich store/collection metadata, fix social links, add LocalBusiness schema, fix rupee symbol |
| **Week 2** | Structured Data | Breadcrumb JSON-LD, FAQPage schema, AggregateRating, VideoObject schema |
| **Week 3** | Content & LLM | Blog infrastructure (10 posts), LLM-optimized descriptions, FAQ sections, How-To guides |
| **Week 4** | Technical SEO | Hreflang tags, GA4 setup, image optimization, Core Web Vitals, PWA manifest, image sitemap |
| **Month 2** | Authority | GMB optimization, 15-20 backlinks, local citations |
| **Month 3** | Scale | 30+ backlinks, blog expansion, infographics, influencer partnerships |

---

## 11. FREE TOOLS STACK

| Tool | Purpose | URL |
|---|---|---|
| Google Search Console | Index monitoring | search.google.com/search-console |
| Google Analytics 4 | Traffic tracking | analytics.google.com |
| PageSpeed Insights | Core Web Vitals | pagespeed.web.dev |
| Rich Results Test | Schema validation | search.google.com/test/rich-results |
| Ahrefs Webmaster Tools | Backlink monitoring (free) | ahrefs.com/webmaster-tools |
| keyword.io | Long-tail keywords | keyword.io |
| AnswerThePublic | Question keywords | answerthepublic.com |
| Schema.org | Schema reference | schema.org |
| Screaming Frog | Technical crawl (free) | screamingfrog.co.uk/seo-spider |

---

**End of Strategy Document**

*This strategy should be reviewed monthly and adjusted based on ranking data, LLM appearance changes, and business priorities. The most impactful first steps are fixing the hero `<h1>`, adding LocalBusiness schema, and starting the blog.*
