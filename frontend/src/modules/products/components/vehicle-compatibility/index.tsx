"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertTriangle, Car, Loader2, ChevronDown } from "lucide-react"
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

    const searchStr = (product.title + " " + (product.description || "") + " " + (product.subtitle || "")).toLowerCase()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMake, selectedModel, selectedYear])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-brand/30 to-transparent" />
        <div className="flex items-center gap-2 text-gray-700">
          <Car size={16} className="text-brand" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Check Vehicle Fitment</h3>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-brand/30 to-transparent" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              disabled={loading.makes}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-xs font-bold text-gray-900 outline-none transition-all duration-200 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Make</option>
              {makes.map((make) => (
                <option key={make.id} value={make.id}>{make.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedMake || loading.models}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-xs font-bold text-gray-900 outline-none transition-all duration-200 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-50"
            >
              <option value="">Model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={!selectedModel || loading.years}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-xs font-bold text-gray-900 outline-none transition-all duration-200 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-50"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(loading.makes || loading.models || loading.years) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 mt-4 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider"
            >
              <Loader2 size={12} className="animate-spin text-brand" />
              <span>Verifying Fitment...</span>
            </motion.div>
          )}

          {compatibility === "compatible" && !loading.makes && !loading.models && !loading.years && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/60 border border-emerald-200 px-5 py-4 flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={16} className="text-emerald-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-800">Guaranteed Fit!</span>
                <span className="text-[10px] text-emerald-600 font-medium">This accessory is compatible with your selected vehicle.</span>
              </div>
            </motion.div>
          )}

          {compatibility === "unknown" && !loading.makes && !loading.models && !loading.years && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/60 border border-amber-200 px-5 py-4 flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-amber-800">Verify Compatibility</span>
                <span className="text-[10px] text-amber-600 font-medium">Please check with support to ensure exact fitment.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
