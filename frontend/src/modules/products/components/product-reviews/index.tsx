"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Star, Loader2, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"
import { fetchReviews, createReview, type Review } from "@lib/data/fastapi"
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

  // Form state
  const [rating, setRating] = useState(5)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const loadReviews = useCallback(() => {
    setLoading(true)
    setError("")
    fetchReviews(productId)
      .then((data) => setReviews(data || []))
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
      await createReview({
        product_id: productId,
        customer_name: name.trim(),
        rating,
        title: title.trim(),
        content: body.trim(),
      })
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

  return (
    <div className="space-y-8 border-t border-gray-100 pt-8">
      <div className="flex items-center gap-2 text-gray-700">
        <MessageSquare size={16} className="text-brand" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Customer Reviews</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: reviews list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-500 font-semibold uppercase tracking-wider gap-2">
              <Loader2 size={14} className="animate-spin text-brand" />
              <span>Loading Reviews...</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {review.customer_name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                      />
                    ))}
                  </div>
                  <h4 className="text-xs font-bold text-gray-700">{review.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-soft p-8 text-center text-xs text-gray-500 font-medium">
              No reviews yet for this product. Be the first to share your thoughts!
            </div>
          )}
        </div>

        {/* Right column: submit form */}
        <div className="bg-white border border-gray-150/60 rounded-2xl p-6 h-fit space-y-4 shadow-premium">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Write A Review</h4>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-soft text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-soft text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rating</label>
              <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => {
                  const starVal = i + 1
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="text-amber-400 focus:outline-none"
                    >
                      <Star size={18} className={starVal <= rating ? "fill-amber-400" : "text-gray-300"} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs outline-none focus:bg-white focus:border-brand transition-all duration-300 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Review Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your review"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs outline-none focus:bg-white focus:border-brand transition-all duration-300 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Review Details</label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What did you think about this accessory?"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs outline-none focus:bg-white focus:border-brand transition-all duration-300 font-medium"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !name.trim() || !title.trim() || !body.trim()}
              className="w-full h-12 flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-dark rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
