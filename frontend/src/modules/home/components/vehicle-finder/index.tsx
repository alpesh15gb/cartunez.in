"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, Search } from "lucide-react"
interface VehicleMake {
  id: string
  name: string
  slug: string
  logo_url?: string
}

interface VehicleModel {
  id: string
  make_id: string
  name: string
  slug: string
  body_type?: string
  image_url?: string
}

interface VehicleYear {
  id: string
  model_id: string
  year: number
}

export default function VehicleFinder() {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [years, setYears] = useState<VehicleYear[]>([])

  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")

  const [loading, setLoading] = useState({ makes: false, models: false, years: false })
  const [error, setError] = useState("")
  const router = useRouter()

  const apiFetch = async (url: string) => {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json()
  }

  useEffect(() => {
    const loadMakes = async () => {
      setLoading((prev) => ({ ...prev, makes: true }))
      setError("")
      try {
        const data = await apiFetch("/api/makes")
        setMakes(data.makes || [])
      } catch (err) {
        console.error("Failed to fetch makes:", err)
        setError("Unable to load vehicle database. Please try again.")
      } finally {
        setLoading((prev) => ({ ...prev, makes: false }))
      }
    }
    loadMakes()
  }, [])

  useEffect(() => {
    if (!selectedMake) {
      setModels([])
      setSelectedModel("")
      setSelectedYear("")
      return
    }
    const loadModels = async () => {
      setLoading((prev) => ({ ...prev, models: true }))
      try {
        const data = await apiFetch(`/api/models?make_id=${selectedMake}`)
        setModels(data.models || [])
      } catch (err) {
        console.error("Failed to fetch models:", err)
        setModels([])
      } finally {
        setLoading((prev) => ({ ...prev, models: false }))
      }
    }
    loadModels()
    setSelectedModel("")
    setSelectedYear("")
  }, [selectedMake])

  useEffect(() => {
    if (!selectedModel) {
      setYears([])
      setSelectedYear("")
      return
    }
    const loadYears = async () => {
      setLoading((prev) => ({ ...prev, years: true }))
      try {
        const data = await apiFetch(`/api/years?model_id=${selectedModel}`)
        setYears(data.years || [])
      } catch (err) {
        console.error("Failed to fetch years:", err)
        setYears([])
      } finally {
        setLoading((prev) => ({ ...prev, years: false }))
      }
    }
    loadYears()
    setSelectedYear("")
  }, [selectedModel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMake) return

    const makeObj = makes.find((m) => m.id === selectedMake)
    const modelObj = models.find((m) => m.id === selectedModel)
    const yearObj = years.find((y) => y.id === selectedYear)

    const params = new URLSearchParams()
    if (makeObj) params.set("make", makeObj.name)
    if (modelObj) params.set("model", modelObj.name)
    if (yearObj) params.set("year", String(yearObj.year))

    router.push(`/store?${params.toString()}`)
  }

  const selectClasses = [
    "w-full appearance-none bg-white border border-gray-200",
    "hover:border-brand/40",
    "rounded-[var(--radius-md)] px-4 py-3.5 pr-10",
    "text-sm font-medium text-gray-900",
    "outline-none",
    "focus:border-brand focus:ring-2 focus:ring-brand/20",
    "transition-all duration-300",
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200",
    "cursor-pointer",
  ].join(" ")

  const isSearching = loading.makes || loading.models || loading.years

  return (
    <div className="content-container -mt-16 relative z-30">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-[var(--shadow-xl)] p-8 sm:p-10">
        {/* Subtle glass decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/20">
              <Search size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900">
                Find Accessories For Your Car
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Select your vehicle details to check compatibility
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] p-4 mb-6 text-sm text-red-600 font-medium">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {/* Make */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">
                  Manufacturer
                </label>
                <div className="relative">
                  <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    disabled={loading.makes}
                    className={selectClasses}
                  >
                    <option value="">Choose Manufacturer</option>
                    {makes.map((make) => (
                      <option key={make.id} value={make.id}>{make.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">
                  Model
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake || loading.models}
                    className={selectClasses}
                  >
                    <option value="">Choose Model</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Year */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">
                  Year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={!selectedModel || loading.years}
                    className={selectClasses}
                  >
                    <option value="">Choose Year</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.year}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedMake || isSearching}
                  className="w-full h-[48px] inline-flex items-center justify-center gap-2.5
                            bg-gradient-to-br from-brand to-brand-dark
                            text-white text-xs font-bold uppercase tracking-[0.15em]
                            rounded-[var(--radius-md)]
                            shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30
                            transition-all duration-300
                            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  {isSearching ? (
                    <><Loader2 size={14} className="animate-spin" /><span>Loading...</span></>
                  ) : (
                    <><span>Find Accessories</span><ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
