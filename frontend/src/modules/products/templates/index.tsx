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
import {
  Truck,
  ShieldCheck,
  Star,
  Wrench,
  Award,
  Headphones,
  CheckCircle,
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
  const avgRating = 4.5
  const reviewCount = 12

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div
          className="content-container grid gap-12 py-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)] lg:gap-16 lg:py-16"
          data-testid="product-container"
        >
          {/* ── Left: Image Gallery ── */}
          <div className="min-w-0">
            <ImageGallery images={images} />
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

                {/* Rating with stars */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({reviewCount} reviews)
                    </span>
                  </div>
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

              {/* ── Premium Trust Badges ── */}
              <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-brand/5 to-brand/10 p-4 ring-1 ring-brand/15">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/25">
                    <ShieldCheck size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">100% Quality Guarantee</span>
                    <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">Every product is tested for quality and fitment. 30-day hassle-free returns.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Award size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Premium Warranty</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">1-year manufacturer warranty. Full coverage against defects.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Wrench size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Fitment Guarantee</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Vehicle-specific fitment verified before dispatch.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Headphones size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Installation Support</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Free expert guidance via chat or phone.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand"><Truck size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Free Express Shipping</span>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">Free shipping above ₹999. Delivered in 3–7 days.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-brand/5 to-brand/10 p-4 text-center ring-1 ring-brand/15">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={16} className="text-brand" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">10,000+ Happy Automotive Enthusiasts</p>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">India&apos;s trusted destination for premium car &amp; bike accessories.</p>
                </div>
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