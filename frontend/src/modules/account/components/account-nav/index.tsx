"use client"

import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import { LayoutDashboard, Settings, LogOut } from "lucide-react"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname() ?? ''
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const navItems = [
    { href: "/account", label: "Overview", icon: LayoutDashboard, testId: "overview-link" },
    { href: "/account/profile", label: "Profile", icon: Settings, testId: "profile-link" },
    { href: "/account/addresses", label: "Addresses", icon: MapPin, testId: "addresses-link" },
    { href: "/account/orders", label: "Orders", icon: Package, testId: "orders-link" },
  ]

  const isActive = (href: string) => {
    const path = route.split(countryCode)[1]
    return path === href
  }

  return (
    <div>
      {/* Mobile Horizontal Tabs */}
      <div className="lg:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 py-3"
            data-testid="account-main-link"
          >
            <ChevronDown className="w-4 h-4 rotate-90 text-gray-400" />
            <span>Account</span>
          </LocalizedClientLink>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)] font-bold text-sm">
                {customer?.first_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Hello, {customer?.first_name}
                </p>
                <p className="text-xs text-gray-500">{customer?.email}</p>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-1 pb-2 -mx-1 px-1 scrollbar-none">
              {navItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <LocalizedClientLink
                    key={item.href}
                    href={item.href}
                    data-testid={item.testId}
                    className={clx(
                      "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                      active
                        ? "bg-[var(--color-brand)] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </LocalizedClientLink>
                )
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all duration-200"
                data-testid="logout-button"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar Nav */}
      <div className="hidden lg:block" data-testid="account-nav">
        {/* User Greeting Card */}
        <div className="mb-8 p-5 rounded-[var(--radius-lg)] bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {customer?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-white">
                Hello, {customer?.first_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{customer?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <LocalizedClientLink
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                className={clx(
                  "group flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  size={18}
                  className={clx(
                    "transition-colors duration-200",
                    active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </LocalizedClientLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 w-full"
            data-testid="logout-button"
          >
            <LogOut className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountNav
