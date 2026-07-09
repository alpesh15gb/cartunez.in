"use client"

import React, { useState } from "react"
import { createLead } from "@lib/data/fastapi"
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Users, Sparkles } from "lucide-react"

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
    <section className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
      <div className="content-container">
        <div className="relative overflow-hidden rounded-none sm:rounded-[var(--radius-lg)] border-y sm:border border-gray-200/80 py-20 sm:py-24 my-0 sm:my-4 shadow-sm">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-brand-light/30 to-white" />

          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,28,28,0.05),transparent_70%)]" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand/[0.03] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center px-6 sm:px-12">
            {/* Left col */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 bg-brand/5 border border-brand/10 rounded-full px-4 py-1.5">
                <Sparkles size={12} className="text-brand" />
                <span className="text-[10px] font-bold text-brand uppercase tracking-[0.2em]">Exclusive Access</span>
              </div>
              <h2
                className="font-display font-black uppercase text-gray-900 leading-none"
                style={{ fontSize: "clamp(40px, 5vw, 72px)", letterSpacing: "-0.02em" }}
              >
                Join The
                <br />
                <span className="text-brand">Crew</span>
              </h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm">
                Early access to new product drops. Custom fitment alerts for your car.
                Subscriber-only deals you won&apos;t find anywhere else.
              </p>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/30 via-brand/20 to-brand/10 border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <Users size={12} className="text-brand" />
                  <span className="text-gray-900 font-bold">2,400+</span> enthusiasts already subscribed
                </span>
              </div>
            </div>

            {/* Right col — form */}
            <div>
              {status === "success" ? (
                <div className="border border-emerald-200/80 bg-emerald-50/80 backdrop-blur-sm rounded-[var(--radius-md)] p-8 space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle size={28} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700 font-semibold leading-relaxed">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {status === "error" && (
                    <div className="flex items-start gap-3 bg-red-50/80 backdrop-blur-sm border border-red-200/80 rounded-[var(--radius-md)] p-4 text-sm text-red-600 font-medium">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
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
                      className="w-full bg-white border border-gray-200 rounded-[var(--radius-md)] px-4 py-3.5 text-sm
                                 text-gray-900 placeholder-gray-400 outline-none
                                 focus:border-brand focus:ring-2 focus:ring-brand/20
                                 transition-all duration-300"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email"
                      className="w-full bg-white border border-gray-200 rounded-[var(--radius-md)] px-4 py-3.5 text-sm
                                 text-gray-900 placeholder-gray-400 outline-none
                                 focus:border-brand focus:ring-2 focus:ring-brand/20
                                 transition-all duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !name.trim()}
                    className="group w-full h-[50px] inline-flex items-center justify-center gap-2.5
                               bg-gradient-to-br from-brand to-brand-dark
                               text-white text-sm font-bold uppercase tracking-[0.12em]
                               rounded-[var(--radius-md)]
                               shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30
                               transition-all duration-300
                               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /><span>Subscribing...</span></>
                    ) : (
                      <><span>Subscribe Now</span><ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" /></>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 font-medium text-center">
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
