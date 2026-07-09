import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BadgeCheck, Truck } from "lucide-react"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="space-y-6">
      {/* Premium badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
          <BadgeCheck className="w-3 h-3" />
          In stock
        </span>
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-brand)]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/15 transition-colors duration-200 hover:bg-[var(--color-brand)] hover:text-white"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
      </div>

      {/* Product title with premium styling */}
      <div className="space-y-3">
        {/* Brand metadata if available */}
        {!!product.metadata?.brand && (
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
            {String(product.metadata?.brand)}
          </span>
        )}
        <h1
          className="text-[28px] sm:text-[34px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.08] text-gray-950"
          data-testid="product-title"
        >
          {product.title}
        </h1>
        {product.description && (
          <p
            className="text-sm leading-[1.6] text-gray-600 line-clamp-5 whitespace-pre-line"
            data-testid="product-description"
          >
            {product.description}
          </p>
        )}
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap gap-3 pt-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
          <Truck className="w-3.5 h-3.5 text-gray-400" />
          Free shipping on orders over ?999
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
          <BadgeCheck className="w-3.5 h-3.5 text-gray-400" />
          Premium quality guaranteed
        </div>
      </div>
    </div>
  )
}

export default ProductInfo