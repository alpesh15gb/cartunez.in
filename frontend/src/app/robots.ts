import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cartunez.in"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/checkout", "/account/", "/order/*/transfer/"],
      },
      // Allow AI/LLM crawlers explicitly
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/checkout", "/account/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/checkout", "/account/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/checkout", "/account/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/checkout", "/account/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/checkout", "/account/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
