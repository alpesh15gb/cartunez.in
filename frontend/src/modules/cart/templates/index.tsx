import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-8 small:py-12 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left column - Items */}
            <div className="flex flex-col gap-y-6">
              {!customer && (
                <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
                  <SignInPrompt />
                </div>
              )}
              <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
                <ItemsTemplate cart={cart} />
              </div>
            </div>

            {/* Right column - Summary */}
            <div className="relative">
              <div className="flex flex-col gap-y-6 sticky top-24">
                {cart && cart.region && (
                  <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.08)]">
                    <Summary cart={cart} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
