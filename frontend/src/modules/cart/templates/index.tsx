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
          <>
            {/* Page Header */}
            <div className="mb-8 space-y-1">
              <h1 className="text-h2 text-gray-900">Shopping Cart</h1>
              <p className="text-sm text-gray-500 font-medium">
                {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
              {/* Left column - Items */}
              <div className="flex flex-col gap-y-6">
                {!customer && (
                  <div className="card-premium p-5 sm:p-6">
                    <SignInPrompt />
                  </div>
                )}
                <div className="card-premium p-5 sm:p-6">
                  <ItemsTemplate cart={cart} />
                </div>
              </div>

              {/* Right column - Summary */}
              <div className="relative">
                <div className="flex flex-col gap-y-6 sticky top-24">
                  {cart && cart.region && (
                    <div className="card-premium p-5 sm:p-6">
                      <Summary cart={cart} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card-premium p-8 sm:p-12">
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
