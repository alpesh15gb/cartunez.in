import Image from "next/image"
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
import AnnouncementBar from "@modules/layout/components/announcement-bar"

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions).catch(() => []),
    listLocales().catch(() => []),
    getLocale().catch(() => null),
    listCategories().catch(() => []),
  ])

  return (
    <>
      <AnnouncementBar />
      <div className="sticky top-0 inset-x-0 z-50 group">
        <header className="relative h-16 lg:h-20 mx-auto border-b duration-300 bg-white/95 border-gray-200/80 backdrop-blur-md text-gray-900 transition-shadow duration-300 shadow-xs">
          <nav className="content-container flex items-center justify-between w-full h-full gap-x-6">
            {/* Left: Mobile menu + Logo */}
            <div className="flex items-center gap-x-3 flex-1 lg:flex-initial">
              <div className="lg:hidden">
                <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
              </div>
              <LocalizedClientLink
                href="/"
                className="flex items-center gap-2 group"
                data-testid="nav-store-link"
              >
                <Image
                  src="/logo.png"
                  alt="Cartunez"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain rounded transition-transform duration-300 group-hover:scale-105"
                  priority
                />
                <span className="hidden sm:inline text-xl lg:text-2xl font-black uppercase tracking-tighter text-gray-900 transition-colors duration-300 group-hover:text-brand">
                  <span className="text-brand">Car</span>Tunez
                </span>
              </LocalizedClientLink>
            </div>

            {/* Center: Navigation */}
            <div className="hidden lg:flex items-center justify-center flex-1 h-full">
              <MegaMenu categories={categories} />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-x-2 lg:gap-x-4 flex-1">
              {/* Search trigger */}
              <div className="hidden sm:block">
                <HeaderSearch />
              </div>

              {/* Account icon */}
              <LocalizedClientLink
                href="/account"
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                aria-label="Account"
                data-testid="nav-account-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </LocalizedClientLink>

              {/* Cart button */}
              <Suspense
                fallback={
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </nav>
        </header>
      </div>
    </>
  )
}
