"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Star, Loader2, MessageSquare, AlertCircle, CheckCircle, User } from "lucide-react"
interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  title: string
  content: string
  is_approved: boolean
  created_at: string
}
import { Button } from "@modules/common/components/ui"

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [rating, setRating] = useState(5)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const loadReviews = useCallback(() => {
    setLoading(true)
    setError("")
    fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`)
      .then((res) => res.ok ? res.json() : Promise.reject("Failed"))
      .then((data) => setReviews(data.reviews || data || []))
      .catch((err) => {
        console.error("Failed to load reviews:", err)
        setError("Unable to load reviews for this product.")
      })
      .finally(() => setLoading(false))
  }, [productId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !title.trim() || !body.trim()) return

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          customer_name: name.trim(),
          rating,
          title: title.trim(),
          content: body.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to submit review")
      setSuccess("Your review has been submitted for moderation. Thank you!")
      setName("")
      setTitle("")
      setBody("")
      setRating(5)
      loadReviews()
    } catch (err) {
      console.error("Failed to submit review:", err)
      setError("Failed to submit your review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const ratingCounts = [0, 0, 0, 0, 0]
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating - 1]++
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-brand/30 to-transparent" />
        <div className="flex items-center gap-2 text-gray-700">
          <MessageSquare size={16} className="text-brand" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Customer Reviews</h3>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-brand/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Reviews List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-gray-500 font-bold uppercase tracking-wider gap-2">
              <Loader2 size={14} className="animate-spin text-brand" />
              <span>Loading Reviews...</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/5 text-brand">
                        <User size={16} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-gray-900">{review.customer_name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(review.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="text-xs font-bold text-gray-900 mb-1">{review.title}</h4>
                  )}
                  <p className="text-xs text-gray-600 leading-relaxed">{review.content}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={32} className="text-gray-200 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No reviews yet</p>
              <p className="text-[11px] text-gray-400 mt-1">Be the first to share your experience</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Review Summary + Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <span className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">{reviews.length} reviews</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star - 1]
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-[10px]">
                        <span className="font-bold text-gray-500 w-3">{star}</span>
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: pct + "%" }} />
                        </div>
                        <span className="text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Write a Review */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              Write a Review
            </h4>

            {success && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-700 mb-4">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Rating</label>
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => {
                    const starVal = i + 1
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star size={20} className={starVal <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Review Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your review"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Review Details</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you think about this accessory?"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !name.trim() || !title.trim() || !body.trim()}
                className="w-full h-12 flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <MessageSquare size={14} />
                    Submit Review
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
