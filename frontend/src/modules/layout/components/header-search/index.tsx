"use client"

import Image from "next/image"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { sdk } from "@lib/config"
import { useParams, useRouter } from "next/navigation"
import { Search, Loader2, X } from "lucide-react"

interface SearchResult {
  id: string
  title: string
  handle: string
  thumbnail?: string
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const params = useParams()
  const countryCode = typeof params?.countryCode === "string" ? params.countryCode : ""

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false)
        setQuery("")
        setResults([])
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsModalOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isModalOpen])

  const handleSearch = useCallback(async (val: string) => {
    if (!val.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const resp = await sdk.client.fetch<{ products: SearchResult[] }>("/store/products", {
        query: { q: val, limit: 5 },
      })
      setResults(resp.products || [])
    } catch (e) {
      console.error("Search failed:", e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const searchTerm = query.trim()

    if (!searchTerm) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = window.setTimeout(() => {
      handleSearch(searchTerm)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, handleSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSelect = (handle: string) => {
    setIsModalOpen(false)
    setQuery("")
    setResults([])
    router.push(countryCode ? `/${countryCode}/products/${handle}` : `/products/${handle}`)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setQuery("")
    setResults([])
  }

  return (
    <>
      <button
        onClick={openModal}
        className="relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        aria-label="Open search"
        data-testid="nav-search-button"
      >
        <Search size={18} strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[12vh]"
          data-testid="search-overlay"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-2xl mx-4 bg-white rounded-[var(--radius-lg)] shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search products, categories..."
                className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:ring-0 p-0"
                autoComplete="off"
                aria-label="Search products"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    inputRef.current?.focus()
                  }}
                  className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-[var(--radius-sm)] shrink-0">
                <span className="text-[11px]">ESC</span>
              </kbd>
            </div>

            {/* Search Content */}
            {query.trim() !== "" && (
              <div className="max-h-[55vh] overflow-y-auto divide-y divide-gray-50">
                {loading ? (
                  <div className="px-5 py-10 text-center">
                    <div className="flex items-center justify-center gap-2.5 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />
                      <span className="font-medium">Searching...</span>
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 font-[var(--font-display)]">
                      Products
                    </div>
                    {results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.handle)}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-4 transition-colors duration-150"
                        data-testid="search-result-item"
                      >
                        {item.thumbnail ? (
                          <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-[var(--radius-sm)] flex items-center justify-center text-[9px] text-gray-400 font-medium shrink-0">
                            Image
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">View product details →</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                      <Search size={20} className="text-gray-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            )}

            {query.trim() === "" && (
              <div className="px-5 py-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 mb-4 shadow-inner">
                  <Search size={22} className="text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-500 font-medium">What are you looking for?</p>
                <p className="text-xs text-gray-400 mt-1">Search across all our automotive products</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-[var(--radius-sm)]">
                    <kbd className="text-[10px] font-medium">⌘K</kbd>
                  </span>
                  <span>to search</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

