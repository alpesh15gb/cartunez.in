import React from "react"
import { HttpTypes } from "@medusajs/types"
import { Ruler, Weight, Shield, MapPin, Tag, Wrench } from "lucide-react"

interface ProductSpecificationsProps {
  product: HttpTypes.StoreProduct
}

export default function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  const specsList = [
    { icon: <Tag size={14} />, label: "Material", value: metadata.material || "Premium Engineered Composite" },
    { icon: <Wrench size={14} />, label: "Fitment Type", value: metadata.fitment || "Vehicle-Specific Direct Fit" },
    { icon: <Shield size={14} />, label: "Waterproof", value: metadata.waterproof || "Yes, All-Weather Rated" },
    { icon: <Shield size={14} />, label: "Warranty", value: metadata.warranty || "1 Year Manufacturer Warranty" },
    { icon: <MapPin size={14} />, label: "Origin", value: metadata.origin || "Made in India" },
    { icon: <Weight size={14} />, label: "Weight", value: product.weight ? product.weight + "g" : "Standard Fitment Weight" },
    { icon: <Ruler size={14} />, label: "Dimensions", value: product.length && product.width ? product.length + "x" + product.width + " mm" : "OEM Standard Size" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-brand/30 to-transparent" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Product Specifications</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-brand/30 to-transparent" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {specsList.map((spec, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand">
                {spec.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {spec.label}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-900 text-right">
                {String(spec.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
