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
import type * as HttpTypes from "@lib/commerce/medusa-v1/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import DeliveryEstimator from "@modules/products/components/delivery-estimator"
import {
  Truck,
  ShieldCheck,
  Wrench,
  Headphones,
} from "lucide-react"

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

  const brandName = (product.metadata?.brand as string) || "Cartunez"
  // Ratings are fetched dynamically in ProductReviews component

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div
          className="content-container grid gap-12 py-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)] lg:gap-16 lg:py-16"
          data-testid="product-container"
        >
          {/* ── Left: Image Gallery ── */}
          <div className="min-w-0">
            <ImageGallery images={images} productTitle={product.title} />
          </div>

          {/* ── Right: Sticky Info Panel ── */}
          <aside className="lg:sticky lg:top-32 lg:h-fit">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
              {/* ── Product Info ── */}
              <ProductInfo product={product} />

              {/* ── Brand & Rating Section ── */}
              <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                {/* Brand Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/8 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-brand ring-1 ring-brand/20">
                    {brandName}
                  </span>
                </div>

                {/* Rating will be loaded from ProductReviews component below */}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Ratings from verified reviews below</span>
                </div>
              </div>

              {/* ── Product Actions ── */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <Suspense
                  fallback={
                    <ProductActions disabled={true} product={product} region={region} />
                  }
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>

              {/* ── Purchase support ── */}
              <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><ShieldCheck size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Secure checkout</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Review your order, delivery details, and payment before purchase.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Wrench size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Check compatibility</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Use the vehicle compatibility information below before ordering.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Headphones size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Need assistance?</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Contact support if you need product or installation information.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Truck size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Delivery estimate</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Enter your postal code below to check the available estimate.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Delivery Estimator ── */}
              <div className="mt-6">
                <DeliveryEstimator />
              </div>

              <ProductOnboardingCta />
            </div>
          </aside>
        </div>

      </div>

      {/* ─── Tabs, Specs, Compatibility, Reviews ─── */}
      <div className="border-t border-gray-100 bg-white py-16 lg:py-20">
        <div className="content-container">
          <div className="mx-auto max-w-5xl space-y-16">
            <ProductSpecifications product={product} />
            <ProductTabs product={product} />
            <VehicleCompatibility product={product} />
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </div>

      {/* ─── Related Products ─── */}
      <div className="bg-gradient-to-t from-gray-50 to-white py-16 lg:py-24">
        <div className="content-container">
          <div className="mb-10 space-y-2 text-center lg:mb-12">
            <span className="eyebrow">Recommendations</span>
            <h2 className="text-h2 text-gray-900">Complete Your Setup</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Customers who viewed this also loved these performance accessories
            </p>
          </div>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default ProductTemplate
