"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle, Car, Loader2 } from "lucide-react"
import {
  fetchMakes,
  fetchModels,
  fetchYears,
  type VehicleMake,
  type VehicleModel,
  type VehicleYear
} from "@lib/data/fastapi"
import { HttpTypes } from "@medusajs/types"

interface VehicleCompatibilityProps {
  product: HttpTypes.StoreProduct
}

export default function VehicleCompatibility({ product }: VehicleCompatibilityProps) {
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [years, setYears] = useState<VehicleYear[]>([])

  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")

  const [loading, setLoading] = useState({ makes: false, models: false, years: false })
  const [compatibility, setCompatibility] = useState<"idle" | "compatible" | "unknown">("idle")

  useEffect(() => {
    setLoading((prev) => ({ ...prev, makes: true }))
    fetchMakes()
      .then(setMakes)
      .catch((err) => console.error("Failed to fetch makes:", err))
      .finally(() => setLoading((prev) => ({ ...prev, makes: false })))
  }, [])

  useEffect(() => {
    if (!selectedMake) {
      setModels([])
      setSelectedModel("")
      setSelectedYear("")
      setCompatibility("idle")
      return
    }
    setLoading((prev) => ({ ...prev, models: true }))
    fetchModels(selectedMake)
      .then(setModels)
      .catch((err) => console.error("Failed to fetch models:", err))
      .finally(() => setLoading((prev) => ({ ...prev, models: false })))
    setSelectedModel("")
    setSelectedYear("")
    setCompatibility("idle")
  }, [selectedMake])

  useEffect(() => {
    if (!selectedModel) {
      setYears([])
      setSelectedYear("")
      setCompatibility("idle")
      return
    }
    setLoading((prev) => ({ ...prev, years: true }))
    fetchYears(selectedModel)
      .then(setYears)
      .catch((err) => console.error("Failed to fetch years:", err))
      .finally(() => setLoading((prev) => ({ ...prev, years: false })))
    setSelectedYear("")
    setCompatibility("idle")
  }, [selectedModel])

  const checkCompatibility = () => {
    if (!selectedMake || !selectedModel || !selectedYear) return

    const makeName = makes.find((m) => m.id === selectedMake)?.name || ""
    const modelName = models.find((m) => m.id === selectedModel)?.name || ""

    const searchStr = `${product.title} ${product.description || ""} ${product.subtitle || ""}`.toLowerCase()
    
    // Check if the model name or make name is mentioned in the product text
    const isCompatible = 
      searchStr.includes(makeName.toLowerCase()) || 
      searchStr.includes(modelName.toLowerCase()) ||
      product.tags?.some((t) => t.value?.toLowerCase() === modelName.toLowerCase())

    setCompatibility(isCompatible ? "compatible" : "unknown")
  }

  useEffect(() => {
    if (selectedMake && selectedModel && selectedYear) {
      checkCompatibility()
    }
  }, [selectedMake, selectedModel, selectedYear])

  return (
    <div className="bg-[#111113] border border-white/5 p-6 rounded-none space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Car size={16} className="text-brand" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Check Vehicle Compatibility</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          disabled={loading.makes}
          className="select-dark py-2.5 px-3 text-[11px] font-semibold"
        >
          <option value="" className="bg-carbon">Make</option>
          {makes.map((make) => (
            <option key={make.id} value={make.id} className="bg-carbon">
              {make.name}
            </option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedMake || loading.models}
          className="select-dark py-2.5 px-3 text-[11px] font-semibold"
        >
          <option value="" className="bg-carbon">Model</option>
          {models.map((model) => (
            <option key={model.id} value={model.id} className="bg-carbon">
              {model.name}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          disabled={!selectedModel || loading.years}
          className="select-dark py-2.5 px-3 text-[11px] font-semibold"
        >
          <option value="" className="bg-carbon">Year</option>
          {years.map((y) => (
            <option key={y.id} value={y.id} className="bg-carbon">
              {y.year}
            </option>
          ))}
        </select>
      </div>

      {loading.makes || loading.models || loading.years ? (
        <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
          <Loader2 size={12} className="animate-spin text-brand" />
          <span>Verifying Fitment...</span>
        </div>
      ) : (
        <>
          {compatibility === "compatible" && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-none text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold">Guaranteed Fit!</span>
                <span className="text-[10px] text-emerald-500 font-medium">This accessory is compatible with your selected vehicle.</span>
              </div>
            </div>
          )}
          {compatibility === "unknown" && (
            <div className="bg-amber-950/20 border border-amber-900/50 text-amber-400 px-4 py-3 rounded-none text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold">Verify Compatibility</span>
                <span className="text-[10px] text-amber-500 font-medium">Please verify model variant details with support to ensure exact fit.</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
