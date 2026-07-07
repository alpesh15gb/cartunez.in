import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
          In stock
        </span>
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="rounded-full bg-brand/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand ring-1 ring-brand/15 transition-colors duration-200 hover:bg-brand hover:text-white"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-h2 text-gray-950" data-testid="product-title">
          {product.title}
        </h1>
        {product.description && (
          <p
            className="text-body text-gray-600 line-clamp-5 whitespace-pre-line"
            data-testid="product-description"
          >
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
