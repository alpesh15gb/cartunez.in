"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { sdk } from "@lib/config"
import { useRouter } from "next/navigation"
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
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    handleSearch(val)
  }

  const handleSelect = (handle: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(`/products/${handle}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search accessories (e.g. Led, Stereo)..."
          className="w-full bg-gray-50 border border-gray-200 rounded-soft pl-10 pr-10 py-2 text-xs focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-200"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-carbon"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (query.trim() !== "") && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-2xl rounded-md z-50 max-h-80 overflow-y-auto divide-y divide-gray-50">
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.handle)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-10 h-10 object-cover rounded-soft bg-gray-50 border border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-soft flex items-center justify-center text-[10px] text-gray-400">
                    Image
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-carbon line-clamp-1">{item.title}</h4>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-gray-500 font-medium">
              {loading ? "Searching..." : "No matching accessories found"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
