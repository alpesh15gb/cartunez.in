import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"

/**
 * Generate a dynamic sitemap covering all major pages.
 * This helps both traditional crawlers and LLM crawlers discover content.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/book-installation`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ]

  // Dynamic product pages
  let productUrls: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: "in",
      queryParams: { limit: 100 },
    })
    productUrls =
      response.products?.map((product) => ({
        url: `${baseUrl}/products/${product.handle}`,
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })) || []
  } catch {
    // Silently fail — sitemap still works with static routes
  }

  // Dynamic category pages
  let categoryUrls: MetadataRoute.Sitemap = []
  try {
    const categories = await listCategories()
    categoryUrls =
      categories?.map((cat) => ({
        url: `${baseUrl}/categories/${cat.handle}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })) || []
  } catch {
    // Silently fail
  }

  // Dynamic collection pages
  let collectionUrls: MetadataRoute.Sitemap = []
  try {
    const { collections } = await listCollections()
    collectionUrls =
      collections?.map((col) => ({
        url: `${baseUrl}/collections/${col.handle}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })) || []
  } catch {
    // Silently fail
  }

  return [
    ...staticRoutes,
    ...productUrls,
    ...categoryUrls,
    ...collectionUrls,
  ]
}
