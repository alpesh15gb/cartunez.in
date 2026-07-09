"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, Search, ShoppingBag, User, ShoppingCart } from "lucide-react"

export default function MobileBottomNav() {
  const pathname = usePathname() ?? ''
  const params = useParams()
  const countryCode = params?.countryCode ?? ''

  const navItems = [
    { label: "Home", href: `/${countryCode}`, icon: Home },
    { label: "Search", href: `/${countryCode}/search`, icon: Search },
    { label: "Store", href: `/${countryCode}/store`, icon: ShoppingBag },
    { label: "Account", href: `/${countryCode}/account`, icon: User },
    { label: "Cart", href: `/${countryCode}/cart`, icon: ShoppingCart },
  ]

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-50 md:hidden safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full text-center transition-all duration-200 relative ${
                isActive ? "text-[var(--color-brand)]" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--color-brand-light)] after:absolute after:-bottom-2 after:w-1 after:h-1 after:rounded-full after:bg-[var(--color-brand)]"
                    : ""
                }`}
              >
                {true && item.label === "Cart" && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-brand)] text-[8px] font-bold text-white shadow-sm shadow-[var(--color-brand)]/30 px-1">
                    0
                  </span>
                )}
                <Icon
                  size={20}
                  className={`transition-all duration-200 ${
                    isActive
                      ? "stroke-[2.5px] text-[var(--color-brand)]"
                      : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] mt-0.5 font-medium tracking-wide transition-all duration-200 ${
                  isActive
                    ? "font-bold text-[var(--color-brand)]"
                    : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
