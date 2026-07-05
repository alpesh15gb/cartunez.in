"use server"

const API_URL = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://fastapi:8000"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const detail = typeof body.detail === "string" ? body.detail : ""
    throw new Error(detail || `API ${res.status}: ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export interface VehicleMake {
  id: string
  name: string
  slug: string
  logo_url?: string
}

export interface VehicleModel {
  id: string
  make_id: string
  name: string
  slug: string
  body_type?: string
  image_url?: string
}

export interface VehicleYear {
  id: string
  model_id: string
  year: number
}

export interface VehicleVariant {
  id: string
  year_id: string
  name: string
  fuel_type?: string
  transmission?: string
}

export async function fetchMakes(): Promise<VehicleMake[]> {
  return apiFetch<VehicleMake[]>("/api/v1/vehicles/makes")
}

export async function fetchModels(makeId?: string): Promise<VehicleModel[]> {
  const q = makeId ? `?make_id=${makeId}` : ""
  return apiFetch<VehicleModel[]>(`/api/v1/vehicles/models${q}`)
}

export async function fetchYears(modelId?: string): Promise<VehicleYear[]> {
  const q = modelId ? `?model_id=${modelId}` : ""
  return apiFetch<VehicleYear[]>(`/api/v1/vehicles/years${q}`)
}

export async function fetchVariants(yearId?: string): Promise<VehicleVariant[]> {
  const q = yearId ? `?year_id=${yearId}` : ""
  return apiFetch<VehicleVariant[]>(`/api/v1/vehicles/variants${q}`)
}

export async function searchVehicles(params: {
  make?: string
  model?: string
  year?: number
  body_type?: string
}): Promise<unknown[]> {
  const q = new URLSearchParams()
  if (params.make) q.set("make", params.make)
  if (params.model) q.set("model", params.model)
  if (params.year) q.set("year", String(params.year))
  if (params.body_type) q.set("body_type", params.body_type)
  return apiFetch<unknown[]>(`/api/v1/vehicles/search?${q}`)
}

export interface LeadCreate {
  name: string
  email: string
  phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: string
  product_interest?: string
  source?: string
  notes?: string
}

export async function createLead(data: LeadCreate): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Blogs ───────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author?: { id: string; name: string }
  category?: { id: string; name: string }
  tags?: { id: string; name: string }[]
  is_published: boolean
  published_at?: string
  created_at: string
}

export async function fetchBlogPosts(params?: { limit?: number; offset?: number }): Promise<BlogPost[]> {
  const q = new URLSearchParams()
  if (params?.limit) q.set("limit", String(params.limit))
  if (params?.offset) q.set("offset", String(params.offset))
  return apiFetch<BlogPost[]>(`/api/v1/blogs/posts?${q}`)
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/blogs/posts/${slug}`)
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  title: string
  body: string
  is_approved: boolean
  created_at: string
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/v1/reviews?product_id=${encodeURIComponent(productId)}`)
}

export async function createReview(data: {
  product_id: string
  customer_name: string
  rating: number
  title: string
  body: string
}): Promise<Review> {
  return apiFetch<Review>("/api/v1/reviews", { method: "POST", body: JSON.stringify(data) })
}

// ─── Support ─────────────────────────────────────────────────────────────────

export async function createSupportTicket(data: {
  subject: string;
  description: string;
  customer_email: string;
  customer_name: string;
  priority?: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/v1/support/tickets", { method: "POST", body: JSON.stringify(data) })
}

// ─── Installation Booking ────────────────────────────────────────────────────

export async function bookInstallation(data: {
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: string
  preferred_date: string
  preferred_time: string
  address: string
  city: string
  vehicle_make?: string
  vehicle_model?: string
  notes?: string
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/v1/installation/bookings", { method: "POST", body: JSON.stringify(data) })
}

// ─── Dealers / Bulk Enquiry ──────────────────────────────────────────────────

export async function submitBulkEnquiry(data: {
  company_name: string
  contact_name: string
  email: string
  phone: string
  product_interest: string
  quantity: number
  message?: string
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/v1/bulk-enquiry/enquiries", { method: "POST", body: JSON.stringify(data) })
}

export async function submitDealerEnquiry(data: {
  business_name: string
  contact_name: string
  email: string
  phone: string
  city: string
  state: string
  business_type: string
  message?: string
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/v1/dealers/enquiries", { method: "POST", body: JSON.stringify(data) })
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string
  title: string
  image_url: string
  category?: string
  created_at: string
}

export async function fetchGallery(params?: { limit?: number; category?: string }): Promise<GalleryItem[]> {
  const q = new URLSearchParams()
  if (params?.limit) q.set("limit", String(params.limit))
  if (params?.category) q.set("category", params.category)
  return apiFetch<GalleryItem[]>(`/api/v1/gallery?${q}`)
}

// ─── Instagram ──────────────────────────────────────────────────────────────

export interface InstagramReel {
  id: string
  shortcode: string
  url: string
  thumbnail: string
  caption: string
  likes: number
}

export async function fetchInstagramReels(): Promise<InstagramReel[]> {
  interface ReelsResponse {
    reels: InstagramReel[]
    count: number
  }
  const data = await apiFetch<ReelsResponse>("/api/v1/social/instagram/reels")
  return data.reels || []
}
