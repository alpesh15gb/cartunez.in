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
      <div className="bg-white">
        <div
          className="content-container grid gap-8 py-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)] lg:gap-12 lg:py-12"
          data-testid="product-container"
        >
          <div className="min-w-0">
            <ImageGallery images={images} />
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-premium sm:p-6 lg:p-7">
              <ProductInfo product={product} />
              <div className="mt-6 border-t border-gray-100 pt-6">
                <Suspense
                  fallback={
                    <ProductActions disabled={true} product={product} region={region} />
                  }
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>
              <div className="mt-6 space-y-5 border-t border-gray-100 pt-6">
                <VehicleCompatibility product={product} />
                <ProductOnboardingCta />
              </div>
            </div>
          </aside>
        </div>

        <div className="content-container grid gap-8 pb-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:pb-16">
          <div className="space-y-8">
            <ProductSpecifications product={product} />
            <ProductTabs product={product} />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="space-y-2">
              <span className="eyebrow">Confidence</span>
              <h2 className="text-h3 text-gray-900">Fitment-first support</h2>
              <p className="text-body text-gray-600">
                Every upgrade is checked for vehicle integration, installation requirements, and long-term use before dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-14 lg:py-20">
        <div className="content-container">
          <div className="mb-8 space-y-2 lg:mb-10">
            <span className="eyebrow">Recommendations</span>
            <h2 className="text-h2 text-gray-900">Related Accessories</h2>
          </div>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
      <div className="content-container mb-16">
        <ProductReviews productId={product.id} />
      </div>
    </>
  )
}

export default ProductTemplate
