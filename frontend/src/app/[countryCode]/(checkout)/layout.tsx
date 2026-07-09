import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Shield, ChevronLeft } from "lucide-react"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-gray-50/50 relative small:min-h-screen">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronLeft size={16} className="text-gray-400" />
            <span className="mt-px hidden small:block">Back to shopping cart</span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/"
            className="text-lg font-display font-bold text-gray-900 tracking-wide"
            data-testid="store-link"
          >
            Cartunez
          </LocalizedClientLink>

          <div className="flex-1 basis-0 flex justify-end">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Shield size={14} className="text-green-500" />
              <span className="hidden small:inline">Secure checkout</span>
            </span>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>

      {/* Footer trust indicator */}
      <footer className="py-6 w-full flex items-center justify-center border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 px-4">
          <span>&copy; ${new Date().getFullYear()} Cartunez. All rights reserved.</span>
          <span className="hidden small:inline">&middot;</span>
          <span className="hidden small:inline">Secure checkout with SSL encryption</span>
          <span className="hidden small:inline">&middot;</span>
          <span className="hidden small:inline">Protected by 256-bit encryption</span>
        </div>
      </footer>
    </div>
  )
}