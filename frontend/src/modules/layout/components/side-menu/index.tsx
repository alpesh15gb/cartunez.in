"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import { Home, Store, User, ShoppingCart } from "lucide-react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"


const SideMenuItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Store", href: "/store", icon: Store },
  { label: "Account", href: "/account", icon: User },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center gap-2 px-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors ease-out duration-200 focus:outline-none"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  <span className="hidden sm:inline">Menu</span>
                </Popover.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  className="fixed inset-0 z-[50] bg-black/40 backdrop-blur-sm"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              </Transition>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <PopoverPanel className="fixed left-0 top-0 z-[51] h-full w-[320px] sm:w-[380px] max-w-[85vw] bg-carbon-dark shadow-2xl shadow-black/50 border-r border-white/[0.06] flex flex-col" data-testid="nav-menu-popup">
                  <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06] shrink-0">
                    <LocalizedClientLink href="/" onClick={close} className="text-lg font-black uppercase tracking-tighter text-white font-display">
                      <span className="text-brand">Car</span>Tunez
                    </LocalizedClientLink>
                    <button data-testid="close-menu-button" onClick={close} className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200" aria-label="Close menu">
                      <XMark />
                    </button>
                  </div>
                  <nav className="flex-1 overflow-y-auto py-6 px-4">
                    <ul className="space-y-1">
                      {SideMenuItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <li key={item.label}>
                            <LocalizedClientLink href={item.href} onClick={close} className="flex items-center gap-4 px-4 py-3.5 rounded-[var(--radius-sm)] text-base font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 group" data-testid={item.label.toLowerCase() + "-link"}>
                              <span className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-white/[0.04] text-gray-500 group-hover:bg-brand/10 group-hover:text-brand transition-all duration-200">
                                <Icon size={18} strokeWidth={1.5} />
                              </span>
                              <span>{item.label}</span>
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>
                  <div className="border-t border-white/[0.06] px-4 py-6 space-y-4 shrink-0">
                    {!!locales?.length && (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-sm)] hover:bg-white/[0.04] transition-colors cursor-pointer" onMouseEnter={languageToggleState.open} onMouseLeave={languageToggleState.close}>
                        <LanguageSelect toggleState={languageToggleState} locales={locales} currentLocale={currentLocale} />
                        <ArrowRightMini className={clx("transition-transform duration-150 text-gray-500", languageToggleState.state ? "rotate-90" : "")} />
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-sm)] hover:bg-white/[0.04] transition-colors cursor-pointer" onMouseEnter={countryToggleState.open} onMouseLeave={countryToggleState.close}>
                      {regions && <CountrySelect toggleState={countryToggleState} regions={regions} />}
                      <ArrowRightMini className={clx("transition-transform duration-150 text-gray-500", countryToggleState.state ? "rotate-90" : "")} />
                    </div>
                    <div className="px-4 pt-2">
                      <Text className="text-[10px] text-gray-600 font-medium">&copy; {new Date().getFullYear()} Cartunez. All rights reserved.</Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
