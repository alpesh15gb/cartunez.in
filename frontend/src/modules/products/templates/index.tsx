import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import VehicleCompatibility from "@modules/products/components/vehicle-compatibility"
import ProductSpecifications from "@modules/products/components/product-specifications"
import ProductReviews from "@modules/products/components/product-reviews"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-12 relative gap-8"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-32 small:max-w-[320px] w-full gap-y-6">
          <ProductInfo product={product} />
          <ProductSpecifications product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative small:px-8 img-zoom-container">
          <ImageGallery images={images} />
        </div>
        <div className="flex flex-col small:sticky small:top-32 small:max-w-[320px] w-full gap-y-6">
          <VehicleCompatibility product={product} />
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <ProductActions disabled={true} product={product} region={region} />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
        </div>
      </div>
      <div className="border-t border-gray-100 py-20">
        <div className="content-container">
          <div className="space-y-2 mb-12">
            <span className="eyebrow">Recommendations</span>
            <h2
              className="font-display font-black uppercase text-gray-900 leading-none"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.02em" }}
            >
              Related Accessories
            </h2>
          </div>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
      <div className="content-container my-12">
        <ProductReviews productId={product.id} />
      </div>
    </>
  )
}

export default ProductTemplate
