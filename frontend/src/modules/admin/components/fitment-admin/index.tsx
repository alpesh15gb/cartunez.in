"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Car,
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Lock,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Product {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
}

interface LinkRow {
  id: string
  variant_id: string
  fitment_type: string
  make: string
  model: string
  year: number | null
  variant_name: string
}

interface Make {
  id: string
  name: string
}
interface Model {
  id: string
  make_id: string
  name: string
}
interface Year {
  id: string
  model_id: string
  year: number
}
interface Variant {
  id: string
  vehicle_year_id: string
  name: string
  engine?: string | null
  transmission?: string | null
  fuel_type?: string | null
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const KEY_STORAGE = "cartunez_admin_key"

const selectClasses = [
  "w-full appearance-none bg-white border border-gray-200",
  "hover:border-brand/40 rounded-[var(--radius-md)] pl-3.5 pr-9 py-2.5",
  "text-sm font-medium text-gray-900",
  "outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
  "transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed",
  "cursor-pointer",
].join(" ")

function ChevronDecorator() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <ChevronDown size={15} className="text-gray-400" />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">
      {children}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function FitmentAdmin() {
  const [adminKey, setAdminKey] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [keyError, setKeyError] = useState("")

  /* product search */
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  /* current links + working set */
  const [links, setLinks] = useState<LinkRow[]>([])
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)

  /* vehicle cascade */
  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [makeId, setMakeId] = useState("")
  const [modelId, setModelId] = useState("")
  const [yearId, setYearId] = useState("")
  const [pickedVariants, setPickedVariants] = useState<string[]>([])

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const headers = () => ({
    "Content-Type": "application/json",
    "X-Admin-Key": adminKey,
  })

  const showNotice = (kind: "ok" | "err", text: string) => {
    setNotice({ kind, text })
    setTimeout(() => setNotice(null), 5000)
  }

  /* ---------------- unlock ---------------- */

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) return
    setKeyError("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/vehicle-links?q=test", {
        headers: { "X-Admin-Key": adminKey },
      })
      if (res.status === 401) {
        setKeyError("That key was rejected. Double-check API_ADMIN_KEY on the server.")
        setBusy(false)
        return
      }
      // Any non-401 response proves the key passed the server-side gate
      // (auth is checked before anything else in the route).
      sessionStorage.setItem(KEY_STORAGE, adminKey)
      setUnlocked(true)
      loadMakes()
    } catch {
      setKeyError("Could not reach the server.")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(KEY_STORAGE)
    if (stored) {
      setAdminKey(stored)
      setUnlocked(true)
      loadMakes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------- vehicle cascade ---------------- */

  const loadMakes = async () => {
    try {
      const res = await fetch("/api/makes")
      const data = await res.json()
      setMakes(data.makes || [])
    } catch (err) {
      console.error("Failed to load makes:", err)
    }
  }

  const onMakeChange = async (id: string) => {
    setMakeId(id)
    setModelId("")
    setYearId("")
    setModels([])
    setYears([])
    setVariants([])
    setPickedVariants([])
    if (!id) return
    try {
      const res = await fetch(`/api/models?make_id=${id}`)
      const data = await res.json()
      setModels(data.models || [])
    } catch {
      setModels([])
    }
  }

  const onModelChange = async (id: string) => {
    setModelId(id)
    setYearId("")
    setYears([])
    setVariants([])
    setPickedVariants([])
    if (!id) return
    try {
      const res = await fetch(`/api/years?model_id=${id}`)
      const data = await res.json()
      setYears(data.years || [])
    } catch {
      setYears([])
    }
  }

  const onYearChange = async (id: string) => {
    setYearId(id)
    setVariants([])
    setPickedVariants([])
    if (!id) return
    try {
      const res = await fetch(`/api/variants?year_id=${id}`)
      const data = await res.json()
      setVariants(data.variants || [])
    } catch {
      setVariants([])
    }
  }

  /* ---------------- product search ---------------- */

  const runSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setProducts([])
        return
      }
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/vehicle-links?q=${encodeURIComponent(term)}`, {
          headers: { "X-Admin-Key": adminKey },
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error("Product search failed:", err)
        setProducts([])
      } finally {
        setSearching(false)
      }
    },
    [adminKey]
  )

  const onQueryChange = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => runSearch(value), 350)
  }

  /* ---------------- select product ---------------- */

  const selectProduct = async (p: Product) => {
    setProduct(p)
    setProducts([])
    setQuery("")
    setLinks([])
    setSelectedVariantIds([])
    setLoadingLinks(true)
    try {
      const res = await fetch(`/api/admin/vehicle-links?product_id=${p.id}`, {
        headers: { "X-Admin-Key": adminKey },
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      const rows: LinkRow[] = data.links || []
      setLinks(rows)
      setSelectedVariantIds(rows.map((r) => r.variant_id))
    } catch (err) {
      console.error("Failed to load links:", err)
      showNotice("err", "Could not load existing compatibility for this product.")
    } finally {
      setLoadingLinks(false)
    }
  }

  /* ---------------- variant picker ---------------- */

  const toggleVariant = (id: string) => {
    setPickedVariants((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const addPickedVariants = () => {
    if (pickedVariants.length === 0) return
    const year = years.find((y) => y.id === yearId)
    const model = models.find((m) => m.id === modelId)
    const make = makes.find((m) => m.id === makeId)
    // Never re-add a variant that is already linked (keeps React keys unique)
    const fresh = pickedVariants.filter((vid) => !selectedVariantIds.includes(vid))
    const newRows: LinkRow[] = fresh.map((vid) => {
      const v = variants.find((x) => x.id === vid)
      return {
        id: `new-${vid}`,
        variant_id: vid,
        fitment_type: "exact",
        make: make?.name || "",
        model: model?.name || "",
        year: year?.year ?? null,
        variant_name: v?.name || "",
      }
    })
    if (newRows.length === 0) {
      showNotice("err", "Those variants are already linked.")
      return
    }
    setLinks((prev) => [...prev, ...newRows])
    setSelectedVariantIds((prev) =>
      Array.from(new Set([...prev, ...fresh]))
    )
    setPickedVariants([])
    setVariants([])
    setYearId("")
    showNotice("ok", `${newRows.length} variant${newRows.length === 1 ? "" : "s"} added — press Save to persist.`)
  }

  const removeLink = (row: LinkRow) => {
    setLinks((prev) => prev.filter((l) => l.id !== row.id))
    setSelectedVariantIds((prev) => prev.filter((id) => id !== row.variant_id))
  }

  /* ---------------- save / clear ---------------- */

  const saveLinks = async (variantIds: string[]) => {
    if (!product) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/vehicle-links", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ product_id: product.id, variant_ids: variantIds }),
      })
      if (!res.ok) throw new Error(String(res.status))
      showNotice(
        "ok",
        variantIds.length === 0
          ? "Compatibility cleared — this product now fits all vehicles (universal)."
          : `Saved ${variantIds.length} compatible vehicle${variantIds.length === 1 ? "" : "s"}.`
      )
      await selectProduct(product)
    } catch (err) {
      console.error("Save failed:", err)
      showNotice("err", "Save failed. Check that the server can reach Medusa (docker network).")
    } finally {
      setBusy(false)
    }
  }

  /* ---------------- render ---------------- */

  return (
    <div className="content-container py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/20">
          <Car size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900">
            Vehicle Fitment Manager
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Link products to specific cars — vehicles with no links fit every car
          </p>
        </div>
        {unlocked && (
          <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <Unlock size={12} /> Admin mode
          </span>
        )}
      </div>

      {notice && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm font-medium ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {notice.kind === "ok" ? (
            <Check size={16} className="mt-0.5 shrink-0" />
          ) : (
            <X size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {!unlocked ? (
        /* ---------- Unlock gate ---------- */
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-white border border-gray-200/80 shadow-[var(--shadow-xl)] p-8 sm:p-12">
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 shadow-lg">
              <Lock size={22} className="text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900">
              Admin Access Required
            </h2>
            <p className="mt-1.5 text-xs text-gray-500 font-medium leading-relaxed">
              Enter the admin key (<code className="text-gray-700">API_ADMIN_KEY</code>) to manage
              vehicle compatibility.
            </p>
            <form onSubmit={handleUnlock} className="mt-6 flex gap-2">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key"
                autoComplete="off"
                className="flex-1 rounded-[var(--radius-md)] border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-300"
              />
              <button
                type="submit"
                disabled={busy || !adminKey.trim()}
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-brand to-brand-dark px-5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-brand/25 transition-all duration-300 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Unlock
              </button>
            </form>
            {keyError && (
              <p className="mt-3 text-xs font-medium text-red-600">{keyError}</p>
            )}
          </div>
        </div>
      ) : (
        /* ---------- Main tool ---------- */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: product */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[var(--radius-lg)] bg-white border border-gray-200/80 shadow-[var(--shadow-md)] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <Package size={16} className="text-brand" />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
                  1 · Choose Product
                </h2>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search products by title or handle…"
                  className="w-full rounded-[var(--radius-md)] border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-300"
                />
                {searching && (
                  <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                )}
              </div>

              {products.length > 0 && (
                <ul className="mt-3 max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-gray-100 divide-y divide-gray-100">
                  {products.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => selectProduct(p)}
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-brand/5"
                      >
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-gray-100">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{p.title}</p>
                          <p className="truncate text-[11px] font-medium text-gray-400">{p.handle}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {product ? (
                <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50/60 p-3.5">
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover bg-white"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white">
                      <Package size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{product.title}</p>
                    <p className="truncate text-[11px] font-medium text-gray-400">{product.handle}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProduct(null)
                      setLinks([])
                      setSelectedVariantIds([])
                    }}
                    className="ml-auto shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                    title="Deselect"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                !query &&
                !searching && (
                  <p className="mt-3 text-center text-[11px] font-medium text-gray-400">
                    {loadingLinks
                      ? "Loading…"
                      : "Search above, then click a product to manage its fitment."}
                  </p>
                )
              )}
            </div>

            {/* Current links */}
            <div className="rounded-[var(--radius-lg)] bg-white border border-gray-200/80 shadow-[var(--shadow-md)] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-brand" />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
                  Current Links {loadingLinks && <Loader2 size={12} className="ml-1 inline animate-spin" />}
                </h2>
              </div>

              {!product ? (
                <p className="text-[11px] font-medium text-gray-400">
                  Select a product first to see which vehicles it is linked to.
                </p>
              ) : links.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-gray-200 bg-gray-50/60 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    No links — universal fit
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-gray-400 leading-relaxed">
                    This product currently shows for every vehicle. Add links below to restrict it.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {links.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-gray-100 bg-gray-50/60 px-3.5 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Car size={14} className="text-brand" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {row.make || "—"} {row.model || "—"}{" "}
                          {row.year ? <span className="text-gray-500">({row.year})</span> : null}
                        </p>
                        <p className="truncate text-[11px] font-medium text-gray-400">
                          {row.variant_name || "All variants"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeLink(row)}
                        className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Remove link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {product && links.length > 0 && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3.5">
                  <p className="text-[11px] font-semibold text-gray-500">
                    {links.length} vehicle{links.length === 1 ? "" : "s"} linked
                  </p>
                  <button
                    onClick={() => saveLinks([])}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Clear all (universal)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: pick vehicle */}
          <div className="lg:col-span-3 rounded-[var(--radius-lg)] bg-white border border-gray-200/80 shadow-[var(--shadow-md)] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <Car size={16} className="text-brand" />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
                2 · Pick Compatible Vehicles
              </h2>
            </div>

            {!product ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
                <Car size={22} className="mx-auto text-gray-300" />
                <p className="mt-2 text-xs font-medium text-gray-400">
                  Choose a product on the left to start linking vehicles.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <FieldLabel>Manufacturer</FieldLabel>
                    <select
                      value={makeId}
                      onChange={(e) => onMakeChange(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">All makes</option>
                      {makes.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDecorator />
                  </div>
                  <div className="relative">
                    <FieldLabel>Model</FieldLabel>
                    <select
                      value={modelId}
                      onChange={(e) => onModelChange(e.target.value)}
                      disabled={!makeId}
                      className={selectClasses}
                    >
                      <option value="">All models</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDecorator />
                  </div>
                  <div className="relative">
                    <FieldLabel>Year</FieldLabel>
                    <select
                      value={yearId}
                      onChange={(e) => onYearChange(e.target.value)}
                      disabled={!modelId}
                      className={selectClasses}
                    >
                      <option value="">All years</option>
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>{y.year}</option>
                      ))}
                    </select>
                    <ChevronDecorator />
                  </div>
                </div>

                {/* Variant list */}
                {yearId && variants.length > 0 && (
                  <div className="mt-5 rounded-[var(--radius-md)] border border-gray-100">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                        Variants of {years.find((y) => y.id === yearId)?.year}
                      </p>
                      <button
                        onClick={() =>
                          setPickedVariants(
                            pickedVariants.length === variants.length
                              ? []
                              : variants.map((v) => v.id)
                          )
                        }
                        className="text-[10px] font-bold uppercase tracking-wider text-brand hover:text-brand-dark transition-colors"
                      >
                        {pickedVariants.length === variants.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {variants.map((v) => (
                        <li key={v.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-brand/5">
                            <input
                              type="checkbox"
                              checked={pickedVariants.includes(v.id)}
                              onChange={() => toggleVariant(v.id)}
                              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#c91c1c]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{v.name}</p>
                              {v.engine || v.fuel_type || v.transmission ? (
                                <p className="truncate text-[11px] font-medium text-gray-400">
                                  {[v.engine, v.fuel_type, v.transmission].filter(Boolean).join(" · ")}
                                </p>
                              ) : null}
                            </div>
                            {pickedVariants.includes(v.id) && (
                              <Check size={14} className="shrink-0 text-brand" />
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={addPickedVariants}
                    disabled={pickedVariants.length === 0}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-brand/30 bg-brand/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-brand transition-all duration-300 hover:bg-brand/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                    Add {pickedVariants.length > 0 ? `${pickedVariants.length} variant${pickedVariants.length === 1 ? "" : "s"}` : "variants"}
                  </button>
                  <button
                    onClick={() => saveLinks(selectedVariantIds)}
                    disabled={busy || !product}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-brand to-brand-dark px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-brand/25 transition-all duration-300 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Save {selectedVariantIds.length > 0 ? `${selectedVariantIds.length} link${selectedVariantIds.length === 1 ? "" : "s"}` : "links"}
                  </button>
                </div>

                <p className="mt-4 text-[11px] font-medium text-gray-400 leading-relaxed">
                  <strong className="text-gray-500">How it works:</strong> add variants from the
                  cascade, then press <strong className="text-gray-500">Save</strong>. Saving
                  replaces the full link set for this product. An empty set means the product fits
                  every vehicle (universal).
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
