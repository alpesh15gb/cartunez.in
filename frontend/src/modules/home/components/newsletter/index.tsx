"use client"

import React, { useState } from "react"
import { createLead } from "@lib/data/fastapi"
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return

    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      await createLead({
        name: name.trim(),
        email: email.trim(),
        source: "newsletter",
        notes: "Subscribed to newsletter from homepage.",
      })
      setStatus("success")
      setMessage("You're in. Expect early drops, exclusive fitment deals, and insider updates.")
      setEmail("")
      setName("")
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please check your details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-carbon border-t border-white/5">
      <div className="content-container">
        <div
          className="relative overflow-hidden border-t border-b border-white/5 py-20"
          style={{ backgroundImage: "linear-gradient(135deg, #0d0d0f 0%, #1a0505 50%, #0d0d0f 100%)" }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,28,28,0.08),transparent_70%)]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left col */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-brand" />
                <span className="text-[11px] font-bold text-brand uppercase tracking-[0.25em]">
                  Exclusive Access
                </span>
              </div>
              <h2
                className="font-display font-black uppercase text-white leading-none"
                style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
              >
                JOIN THE
                <br />
                <span className="text-brand">CREW</span>
              </h2>
              <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-sm">
                Early access to new product drops. Custom fitment alerts for your car.
                Subscriber-only deals you won&apos;t find anywhere else.
              </p>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-carbon"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  <span className="text-white font-bold">2,400+</span> enthusiasts already subscribed
                </span>
              </div>
            </div>

            {/* Right col — form */}
            <div>
              {status === "success" ? (
                <div className="border border-emerald-900/50 bg-emerald-950/30 p-8 space-y-3">
                  <CheckCircle size={24} className="text-emerald-400" />
                  <p className="text-sm text-emerald-300 font-semibold leading-relaxed">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === "error" && (
                    <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 p-4 text-xs text-red-400 font-semibold">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{message}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="input-dark"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email"
                      className="input-dark"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !name.trim()}
                    className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe Now</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-600 font-medium">
                    No spam. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
