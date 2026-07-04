"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Car, Loader2, ArrowRight } from "lucide-react"
import {
  fetchMakes,
  fetchModels,
  fetchYears,
  type VehicleMake,
  type VehicleModel,
  type VehicleYear
} from "@lib/data/fastapi"
import { Button } from "@modules/common/components/ui"

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

  // Load makes
  useEffect(() => {
    setLoading((prev) => ({ ...prev, makes: true }))
    setError("")
    fetchMakes()
      .then(setMakes)
      .catch((err) => {
        console.error("Failed to fetch makes:", err)
        setError("Unable to load vehicle database. Please try again.")
      })
      .finally(() => setLoading((prev) => ({ ...prev, makes: false })))
  }, [])

  // Load models on make selection
  useEffect(() => {
    if (!selectedMake) {
      setModels([])
      setSelectedModel("")
      setSelectedYear("")
      return
    }
    setLoading((prev) => ({ ...prev, models: true }))
    fetchModels(selectedMake)
      .then(setModels)
      .catch((err) => console.error("Failed to fetch models:", err))
      .finally(() => setLoading((prev) => ({ ...prev, models: false })))
    setSelectedModel("")
    setSelectedYear("")
  }, [selectedMake])

  // Load years on model selection
  useEffect(() => {
    if (!selectedModel) {
      setYears([])
      setSelectedYear("")
      return
    }
    setLoading((prev) => ({ ...prev, years: true }))
    fetchYears(selectedModel)
      .then(setYears)
      .catch((err) => console.error("Failed to fetch years:", err))
      .finally(() => setLoading((prev) => ({ ...prev, years: false })))
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

  return (
    <div className="content-container -mt-16 relative z-30">
      <div className="dark-glass-card text-white rounded-xl p-8 shadow-glow border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand rounded-lg neon-glow">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">Find Accessories For Your Car</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-0.5">Select your vehicle details to check compatibility</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-400 px-4 py-2.5 rounded-soft text-xs font-semibold mb-6 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Make</label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              disabled={loading.makes}
              className="bg-white/5 border border-white/10 hover:border-brand/40 rounded-lg px-4 py-3.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium text-white transition-all duration-300 disabled:opacity-30"
            >
              <option value="">Choose Manufacturer</option>
              {makes.map((make) => (
                <option key={make.id} value={make.id} className="bg-carbon text-white">
                  {make.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedMake || loading.models}
              className="bg-white/5 border border-white/10 hover:border-brand/40 rounded-lg px-4 py-3.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium text-white transition-all duration-300 disabled:opacity-30"
            >
              <option value="">Choose Model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id} className="bg-carbon text-white">
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={!selectedModel || loading.years}
              className="bg-white/5 border border-white/10 hover:border-brand/40 rounded-lg px-4 py-3.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium text-white transition-all duration-300 disabled:opacity-30"
            >
              <option value="">Choose Year</option>
              {years.map((y) => (
                <option key={y.id} value={y.id} className="bg-carbon text-white">
                  {y.year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end pt-3 sm:pt-0">
            <Button
              type="submit"
              disabled={!selectedMake || loading.makes || loading.models || loading.years}
              className="w-full h-12 flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-dark rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {(loading.makes || loading.models || loading.years) ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Find Accessories</span>
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
