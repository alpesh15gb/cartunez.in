"use client"
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-gray-200 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-xs font-bold">
            1
          </div>
          <Heading
            level="h2"
            className="text-lg font-display font-bold text-gray-900"
          >
            Shipping Address
          </Heading>
          {!isOpen && (
            <CheckCircleSolid className="text-green-500 w-5 h-5" />
          )}
        </div>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      {isOpen ? (
        <form action={formAction}>
          <div className="space-y-5">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-base font-display font-bold text-gray-900 mb-4"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton
              className="w-full sm:w-auto h-11 px-8 rounded-[var(--radius-sm)] text-sm font-bold tracking-wider shadow-sm hover:shadow-md transition-all duration-200"
              data-testid="submit-address-button"
            >
              Continue to delivery
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-sm text-gray-500">
            {cart && cart.shipping_address ? (
              <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                <div
                  className="flex flex-col w-full sm:w-1/3"
                  data-testid="shipping-address-summary"
                >
                  <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                    Shipping Address
                  </Text>
                  <div className="space-y-0.5 text-gray-500">
                    <p>
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </p>
                    <p>
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </p>
                    <p>
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </p>
                    <p>
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div
                  className="flex flex-col w-full sm:w-1/3"
                  data-testid="shipping-contact-summary"
                >
                  <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                    Contact
                  </Text>
                  <div className="space-y-0.5 text-gray-500">
                    <p>{cart.shipping_address.phone}</p>
                    <p>{cart.email}</p>
                  </div>
                </div>

                <div
                  className="flex flex-col w-full sm:w-1/3"
                  data-testid="billing-address-summary"
                >
                  <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                    Billing Address
                  </Text>

                  {sameAsBilling ? (
                    <p className="text-gray-500">
                      Billing and delivery address are the same.
                    </p>
                  ) : (
                    <div className="space-y-0.5 text-gray-500">
                      <p>
                        {cart.billing_address?.first_name}{" "}
                        {cart.billing_address?.last_name}
                      </p>
                      <p>
                        {cart.billing_address?.address_1}{" "}
                        {cart.billing_address?.address_2}
                      </p>
                      <p>
                        {cart.billing_address?.postal_code},{" "}
                        {cart.billing_address?.city}
                      </p>
                      <p>
                        {cart.billing_address?.country_code?.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-6" />
    </div>
  )
}

export default Addresses
