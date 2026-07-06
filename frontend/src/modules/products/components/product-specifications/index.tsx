import React from "react"
import { HttpTypes } from "@medusajs/types"

interface ProductSpecificationsProps {
  product: HttpTypes.StoreProduct
}

export default function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  const specsList = [
    { label: "Material", value: metadata.material || "Premium Engineered Hybrid" },
    { label: "Fitment Type", value: metadata.fitment || "Vehicle-Specific Direct Replacement" },
    { label: "Waterproof", value: metadata.waterproof || "Yes, All-Weather Resistant" },
    { label: "Warranty", value: metadata.warranty || "1 Year Manufacturer Warranty" },
    { label: "Origin", value: metadata.origin || "Made in India" },
    { label: "Weight", value: product.weight ? `${product.weight}g` : "Standard Fitment Weight" },
    { label: "Dimensions", value: product.length && product.width ? `${product.length}x${product.width} mm` : "OEM Standard Size" }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Specifications</h3>
      <div className="bg-white border border-gray-150/60 rounded-2xl overflow-hidden shadow-premium">
        <div className="divide-y divide-gray-150/40">
          {specsList.map((spec, idx) => (
            <div key={idx} className="grid grid-cols-3 py-3 px-5 text-xs font-medium hover:bg-gray-50/50 transition-colors duration-250">
              <div className="text-gray-400 uppercase tracking-widest text-[9px] self-center">{spec.label}</div>
              <div className="col-span-2 text-gray-900 self-center font-bold">{String(spec.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
