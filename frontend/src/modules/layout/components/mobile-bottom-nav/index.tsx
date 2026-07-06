"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, Compass, ShoppingCart, User } from "lucide-react"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { countryCode } = useParams()

  const navItems = [
    { label: "Home", href: `/${countryCode}`, icon: Home },
    { label: "Shop", href: `/${countryCode}/store`, icon: Compass },
    { label: "Cart", href: `/${countryCode}/cart`, icon: ShoppingCart },
    { label: "Account", href: `/${countryCode}/account`, icon: User },
  ]

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-50 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full text-center transition-colors duration-300 ${
                isActive ? "text-brand" : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-2"} />
              <span className="text-[10px] mt-1 font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
