import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import VehicleFinder from "@modules/home/components/vehicle-finder"
import PromoBanners from "@modules/home/components/promo-banners"
import FeaturedBrands from "@modules/home/components/featured-brands"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import InstagramReels from "@modules/home/components/instagram-reels"
import Newsletter from "@modules/home/components/newsletter"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "CarTunez - Premium Car Accessories Online India | Floor Mats, LED Lights, Seat Covers",
  description:
    "Upgrade your ride with premium automotive accessories. Premium quality car mats, LED headlights, Android stereo systems, seat covers & more at Cartunez.",
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
    <>
      <Hero />
      <VehicleFinder />
      <PromoBanners />
      <div className="bg-white py-12">
        <ul className="flex flex-col gap-y-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <FeaturedBrands />
      <WhyChooseUs />
      <InstagramReels />
      <Newsletter />
    </>
  )
}
