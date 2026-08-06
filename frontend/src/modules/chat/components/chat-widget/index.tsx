"use client"

import React, { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUp,
  Bot,
  Camera,
  Check,
  Headphones,
  ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { ChatAction, ChatProductCard, sendChatMessage } from "@lib/data/fastapi"

interface ChatMessageItem {
  role: "user" | "assistant"
  text: string
  products?: ChatProductCard[]
  actions?: ChatAction[]
  image_url?: string | null
  uploaded_image?: string | null
  handoff?: boolean
  cart_id?: string | null
  checkout_url?: string | null
  order_id?: string | null
}

const SUGGESTIONS = [
  "Show me android car stereos",
  "LED lights for my car",
  "Best alloy wheels",
  "Seat covers for Maruti Swift",
]

const CONTACTS = [
  { label: "Call +91 9949695030", href: "tel:+919949695030" },
  { label: "WhatsApp us", href: "https://wa.me/919949695030" },
  { label: "Email adnan@cartunez.in", href: "mailto:adnan@cartunez.in" },
]

export default function ChatWidget({
  customerId,
}: {
  customerId?: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  // Persist the anonymous session id so conversation memory survives page
  // loads; signed-in customers are remembered via customer_id on the backend.
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return `chat-${Date.now()}`
    try {
      const existing = window.localStorage.getItem("chat_session_id")
      if (existing) return existing
      const id = window.crypto?.randomUUID?.() || `chat-${Date.now()}`
      window.localStorage.setItem("chat_session_id", id)
      return id
    } catch {
      return window.crypto?.randomUUID?.() || `chat-${Date.now()}`
    }
  })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, busy, open])

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || busy) return

    const userMsg: ChatMessageItem = {
      role: "user",
      text,
      uploaded_image: uploadedImage,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setShowSuggestions(false)
    setBusy(true)
    setUploadedImage(null)

    try {
      const reply = await sendChatMessage({
        message: text,
        session_id: sessionId,
        image: uploadedImage || null,
        customer_id: customerId || null,
      })
      const assistantMsg: ChatMessageItem = {
        role: "assistant",
        text: reply.reply,
        products: reply.products,
        actions: reply.actions,
        image_url: reply.image_url,
        handoff: reply.handoff,
        cart_id: reply.cart_id,
        checkout_url: reply.checkout_url,
        order_id: reply.order_id,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error("[ChatWidget] send failed:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't reach the assistant right now. Please try again, or call us at +91 9949695030.",
          handoff: true,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 4 * 1024 * 1024) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "That image is larger than 4 MB. Please try a smaller photo.",
        },
      ])
      return
    }
    const reader = new FileReader()
    reader.onload = () => setUploadedImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  // Adopt a bot-created cart into the storefront's cart cookie, then head to checkout.
  const handleCheckout = async (cartId?: string | null) => {
    if (!cartId) return
    try {
      await fetch("/api/cart/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      })
    } catch (err) {
      console.error("[ChatWidget] adopt cart failed:", err)
    }
    const countryCode = pathname.split("/")[1] || "in"
    router.push(`/${countryCode}/checkout`)
  }

  const runAction = (action: ChatAction) => {
    if (action.type === "checkout") {
      handleCheckout(action.value)
      return
    }
    if (action.type === "link") {
      if (action.value.startsWith("http")) {
        window.open(action.value, "_blank")
      } else {
        router.push(action.value)
      }
    }
  }

  return (
    <>
      {/* ── Launcher ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI chat assistant"
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] group"
        >
          <span className="absolute inset-0 rounded-full bg-brand/30 animate-ping opacity-40 group-hover:opacity-0 transition-opacity" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark shadow-xl shadow-brand/30 transition-transform duration-300 group-hover:scale-110">
            <Bot size={24} className="text-white" />
          </span>
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
            <Sparkles size={10} className="text-white" />
          </span>
        </button>
      )}

      {/* ── Panel ── */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 md:inset-x-auto md:right-6 md:bottom-6 md:w-[400px] md:max-h-[600px] z-[60] flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white border border-gray-200/80 shadow-[var(--shadow-2xl)]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-brand to-brand-dark px-4 py-3.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Bot size={18} className="text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">CarTunez Assistant</p>
              <p className="text-[10px] font-medium text-white/70">AI-powered · answers instantly</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-3.5 py-4 min-h-[280px] md:min-h-[360px] max-h-[50vh] md:max-h-[440px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/25">
                  <Sparkles size={22} className="text-white" />
                </div>
                <p className="text-sm font-bold text-gray-900">Hi, I&apos;m CarTunez AI! 🚗</p>
                <p className="mt-1 max-w-[240px] text-xs font-medium text-gray-500 leading-relaxed">
                  Ask me about accessories, upload a car photo to preview products, or find what fits your car.
                </p>
                {showSuggestions && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-brand/25 bg-brand/5 px-3 py-1.5 text-[11px] font-semibold text-brand transition-colors hover:bg-brand/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user" ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20"
                        : "rounded-bl-sm bg-white border border-gray-200/70 text-gray-800 shadow-sm"
                    }`}
                  >
                    {m.uploaded_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.uploaded_image}
                        alt="Uploaded"
                        className="mb-2 h-28 w-full rounded-[var(--radius-md)] object-cover border border-gray-100"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>

                  {/* Generated mockup image */}
                  {m.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image_url}
                      alt="Product preview"
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-gray-100 object-cover shadow-sm"
                    />
                  )}

                  {/* Product cards */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => router.push(`/product/${p.handle}`)}
                          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] bg-white border border-gray-200/70 p-2.5 text-left shadow-sm transition-all duration-200 hover:border-brand/40 hover:shadow-md"
                        >
                          {p.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.thumbnail}
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-[var(--radius-sm)] object-cover bg-gray-100"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-gray-100">
                              <ImageIcon size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-900">{p.title}</p>
                            {p.price && <p className="text-[11px] font-bold text-brand">{p.price}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((a, j) => (
                        <button
                          key={j}
                          onClick={() => runAction(a)}
                          className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-wider transition-colors hover:border-brand/40 hover:text-brand"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bot-built cart → checkout */}
                  {m.checkout_url && m.cart_id && (
                    <button
                      onClick={() => handleCheckout(m.cart_id)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-brand to-brand-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand/25 transition-all duration-200 hover:shadow-lg"
                    >
                      🛒 Proceed to Checkout
                    </button>
                  )}

                  {/* Order placed confirmation */}
                  {m.order_id && (
                    <div className="mt-2 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 p-3 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Order placed 🎉
                      </p>
                    </div>
                  )}

                  {/* Handoff card */}
                  {m.handoff && (
                    <div className="mt-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <Headphones size={14} className="text-amber-600" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                          Talk to a human
                        </p>
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {CONTACTS.map((c) => (
                          <a
                            key={c.href}
                            href={c.href}
                            target={c.href.startsWith("http") ? "_blank" : undefined}
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-full bg-white border border-amber-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:border-amber-400"
                          >
                            {c.href.startsWith("tel") ? <MessageCircle size={12} /> : <Check size={12} />}
                            {c.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white border border-gray-200/70 px-3.5 py-2.5 shadow-sm">
                  <Loader2 size={13} className="animate-spin text-brand" />
                  <span className="text-xs font-medium text-gray-500">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Image preview */}
          {uploadedImage && (
            <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3.5 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage}
                alt="Preview"
                className="h-10 w-10 rounded-[var(--radius-sm)] object-cover border border-gray-200"
              />
              <p className="flex-1 truncate text-[11px] font-medium text-gray-500">
                Car photo attached — ask how a product will look!
              </p>
              <button
                onClick={() => setUploadedImage(null)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach car photo"
              className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-brand/10 hover:text-brand"
            >
              <Camera size={17} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask about accessories…"
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all duration-200 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/25 transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </div>

          <p className="border-t border-gray-50 bg-white px-3.5 py-1.5 text-center text-[9px] font-medium text-gray-400">
            AI may make mistakes — verify fitment before ordering · <ArrowUp size={8} className="inline" /> works for you
          </p>
        </div>
      )}
    </>
  )
}
