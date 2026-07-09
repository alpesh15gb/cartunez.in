import { Metadata } from "next"
import { Suspense } from "react"

import Hero from "@modules/home/components/hero"
import FeaturedCategories from "@modules/home/components/featured-categories"
import FeaturedProducts from "@modules/home/components/featured-products"
import VehicleFinder from "@modules/home/components/vehicle-finder"
import FeaturedBrands from "@modules/home/components/featured-brands"
import PromoBanner from "@modules/home/components/promo-banner"
import RecentlyAdded from "@modules/home/components/recently-added"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CustomerReviews from "@modules/home/components/customer-reviews"
import InstagramReels from "@modules/home/components/instagram-reels"
import Newsletter from "@modules/home/components/newsletter"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "CarTunez - Premium Car Accessories Online India | Floor Mats, LED Lights, Seat Covers",
  description:
    "Upgrade your ride with premium automotive accessories. Premium quality car mats, LED headlights, Android stereo systems, seat covers & more at Cartunez.",
}

async function FeaturedProductsSection({ region, collections }: { region: NonNullable<Awaited<ReturnType<typeof getRegion>>>, collections: Awaited<ReturnType<typeof listCollections>>["collections"] }) {
  return (
    <div className="bg-white py-12">
      <ul className="flex flex-col gap-y-6">
        <FeaturedProducts collections={collections ?? []} region={region} />
      </ul>
    </div>
  )
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <main>
      <Hero />
      <FeaturedCategories />
      <Suspense fallback={<div className="bg-white py-12"><div className="content-container"><div className="h-96 bg-gray-50 animate-pulse rounded-[var(--radius-lg)]" /></div></div>}>
        <FeaturedProductsSection region={region} collections={collections} />
      </Suspense>
      <VehicleFinder />
      <FeaturedBrands />
      <PromoBanner />
      <Suspense fallback={<div className="py-16"><div className="content-container"><div className="h-64 bg-gray-50 animate-pulse rounded-[var(--radius-lg)]" /></div></div>}>
        <RecentlyAdded region={region} />
      </Suspense>
      <WhyChooseUs />
      <CustomerReviews />
      <InstagramReels />
      <Newsletter />
    </main>
  )
}
