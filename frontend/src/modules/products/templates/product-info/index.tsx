import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-5 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-[10px] font-bold text-brand uppercase tracking-widest
                       hover:text-brand-dark transition-colors duration-200"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <div>
          <span className="red-line mb-4" />
          <h1
            className="font-display font-black uppercase text-gray-900 leading-tight"
            style={{ fontSize: "clamp(28px, 3vw, 44px)", letterSpacing: "-0.02em" }}
            data-testid="product-title"
          >
            {product.title}
          </h1>
        </div>

        <p
          className="text-sm text-gray-500 font-medium leading-relaxed whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </p>
      </div>
    </div>
  )
}

export default ProductInfo
