/**
 * JSON-LD structured data generators for LLM + traditional SEO.
 * These schemas help search engines and AI models understand Cartunez content.
 */

export interface OrganizationSchema {
  name: string
  url: string
  logo: string
  description: string
  sameAs: string[]
  address?: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  contactPoint?: {
    telephone: string
    contactType: string
  }
}

export const defaultOrganization: OrganizationSchema = {
  name: "Cartunez",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://cartunez.in",
  logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://cartunez.in"}/logo.png`,
  description:
    "India's premium destination for automotive accessories including floor mats, LED lighting, seat covers, dash cameras, and infotainment systems.",
  sameAs: [
    "https://instagram.com/cartunez_hyd",
    "https://facebook.com/cartunez",
    "https://youtube.com/@cartunez",
  ],
  address: {
    streetAddress: "Shop No 12",
    addressLocality: "Secunderabad",
    addressRegion: "Telangana",
    postalCode: "500003",
    addressCountry: "IN",
  },
  contactPoint: {
    telephone: "+91-XXXXXXXXXX",
    contactType: "customer service",
  },
}

/**
 * Generate Organization JSON-LD.
 */
export function organizationJsonLd(org?: Partial<OrganizationSchema>): string {
  const data = { ...defaultOrganization, ...org }
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${data.url}/#organization`,
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs,
    ...(data.address && {
      address: {
        "@type": "PostalAddress",
        ...data.address,
      },
    }),
    ...(data.contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...data.contactPoint,
      },
    }),
  })
}

/**
 * Generate Product JSON-LD for a product detail page.
 */
export function productJsonLd(product: {
  id: string
  title: string
  description?: string | null
  thumbnail?: string | null
  url: string
  price: number
  currency: string
  availability?: "InStock" | "OutOfStock" | "PreOrder"
  brand?: string
  sku?: string
  reviews?: { ratingValue: number; reviewCount: number }
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${product.url}/#product`,
    name: product.title,
    description: product.description || product.title,
    image: product.thumbnail || undefined,
    sku: product.sku || product.id,
    url: product.url,
    ...(product.brand && {
      brand: {
        "@type": "Brand",
        name: product.brand,
      },
    }),
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: product.currency,
      price: product.price,
      availability: `https://schema.org/${product.availability || "InStock"}`,
    },
    ...(product.reviews && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.reviews.ratingValue,
        reviewCount: product.reviews.reviewCount,
      },
    }),
  })
}

/**
 * Generate BreadcrumbList JSON-LD.
 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

/**
 * Generate FAQPage JSON-LD.
 */
export function faqJsonLd(
  faqs: { question: string; answer: string }[]
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  })
}

/**
 * Generate HowTo JSON-LD for installation guides.
 */
export function howToJsonLd(data: {
  name: string
  description: string
  image?: string
  steps: { name: string; text: string; image?: string }[]
  totalTime?: string
  tool?: string[]
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    ...(data.image && { image: data.image }),
    ...(data.totalTime && { totalTime: data.totalTime }),
    ...(data.tool && {
      tool: data.tool.map((t) => ({ "@type": "HowToTool", name: t })),
    }),
    step: data.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  })
}

/**
 * Generate WebSite JSON-LD with search action (for site search enhancement).
 */
export function websiteJsonLd(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://cartunez.in"
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url,
    name: "Cartunez",
    description:
      "Premium car accessories online in India. Shop floor mats, LED lights, seat covers, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/store?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })
}
