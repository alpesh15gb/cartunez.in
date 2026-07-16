"use client"

import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  MapPin,
  Tag,
  Weight,
  Maximize2,
} from "lucide-react"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "shipping">("info")

  const tabs: { id: "info" | "shipping"; label: string }[] = [
    { id: "info", label: "Product Information" },
    { id: "shipping", label: "Shipping & Returns" },
  ]

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={"relative px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 " +
              (activeTab === tab.id
                ? "text-brand"
                : "text-gray-400 hover:text-gray-600")}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="relative mt-2">
        <AnimatePresence mode="wait">
          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProductInfoTab product={product} />
            </motion.div>
          )}
          {activeTab === "shipping" && (
            <motion.div
              key="shipping"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ShippingInfoTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const specs = [
    { icon: <Tag size={14} />, label: "Material", value: product.material || "Premium Engineered Hybrid" },
    { icon: <MapPin size={14} />, label: "Country of origin", value: product.origin_country || "India" },
    { icon: <Tag size={14} />, label: "Type", value: product.type?.value || "Performance Accessory" },
    { icon: <Weight size={14} />, label: "Weight", value: product.weight ? product.weight + " g" : "Standard" },
    { icon: <Ruler size={14} />, label: "Dimensions", value: product.length && product.width && product.height ? product.length + "L x " + product.width + "W x " + product.height + "H" : "OEM Standard" },
    { icon: <Maximize2 size={14} />, label: "Fitment", value: "Vehicle-Specific Direct Fit" },
  ]

  return (
    <div className="py-6">
      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        {product.description || "Premium automotive accessory engineered for optimal performance, durability, and perfect fitment."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {specs.map((spec, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand">
              {spec.icon}
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400">{spec.label}</span>
              <span className="block text-xs font-bold text-gray-900 truncate">{String(spec.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const items = [
    {
      icon: <Truck size={18} />,
      title: "Free Express Shipping",
      desc: "Free shipping on all orders above Rs. 999. Delivered within 3-7 business days across India.",
    },
    {
      icon: <RotateCcw size={18} />,
      title: "Easy 30-Day Returns",
      desc: "Not the right fit? Return within 30 days for a full refund. No questions asked.",
    },
    {
      icon: <ShieldCheck size={18} />,
      title: "1-Year Warranty",
      desc: "All products come with a comprehensive manufacturer warranty against manufacturing defects.",
    },
  ]

  return (
    <div className="py-6 space-y-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand">
            {item.icon}
          </div>
          <div>
            <span className="text-xs font-bold text-gray-900">{item.title}</span>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductTabs
