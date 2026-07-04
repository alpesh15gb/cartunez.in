import { Suspense } from "react"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import MegaMenu from "@modules/layout/components/mega-menu"
import HeaderSearch from "@modules/layout/components/header-search"
export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions).catch(() => []),
    listLocales().catch(() => []),
    getLocale().catch(() => null),
    listCategories().catch(() => []),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-20 mx-auto border-b duration-300 bg-carbon-dark/95 border-white/10 backdrop-blur-md text-white shadow-glow">
        <nav className="content-container txt-xsmall-plus text-gray-300 flex items-center justify-between w-full h-full text-small-regular gap-x-4">
          <div className="flex items-center gap-x-4 flex-1 md:flex-initial">
            <div className="md:hidden">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-white uppercase font-extrabold tracking-tighter"
              data-testid="nav-store-link"
            >
              <span className="text-brand">Car</span><span className="text-white">Tunez</span>
            </LocalizedClientLink>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 h-full">
            <MegaMenu categories={categories} />
          </div>

          <div className="flex items-center gap-x-4 flex-1 justify-end">
            <div className="hidden sm:block w-full max-w-xs">
              <HeaderSearch />
            </div>
            <div className="hidden small:flex items-center gap-x-4 h-full">
              <LocalizedClientLink
                className="hover:text-brand text-xs font-semibold uppercase tracking-wider text-gray-300 transition-colors duration-300"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-brand flex gap-2 text-xs font-semibold uppercase tracking-wider text-gray-300 transition-colors duration-300"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
