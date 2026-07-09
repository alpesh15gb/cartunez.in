import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingBag, ArrowRight } from "lucide-react"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center"
      data-testid="empty-cart-message"
    >
      {/* Premium illustration */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
          <ShoppingBag
            size={44}
            className="text-gray-300"
            strokeWidth={1}
          />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center">
          <span className="text-[var(--color-brand)] text-lg leading-none">!</span>
        </div>
      </div>

      <Heading
        level="h2"
        className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 tracking-tight"
      >
        Your cart is empty
      </Heading>

      <Text className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
        Looks like you haven&apos;t added anything yet. Start exploring our
        premium automotive collection.
      </Text>

      <LocalizedClientLink href="/store">
        <Button
          variant="primary"
          size="large"
          className="min-w-[220px] h-12 rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200 group"
          data-testid="start-shopping-button"
        >
          <span className="flex items-center gap-2">
            Start Shopping
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
