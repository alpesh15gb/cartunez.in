"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Truck, Store } from "lucide-react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) return ""
  let ret = ""
  if (address.address_1) ret += ` ${address.address_1}`
  if (address.address_2) ret += `, ${address.address_2}`
  if (address.postal_code) ret += `, ${address.postal_code} ${address.city}`
  if (address.country_code) ret += `, ${address.country_code.toUpperCase()}`
  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [, setIsLoadingPrices] = useState(true)
  const [showPickupOptions, setShowPickupOptions] = useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)
    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))
      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })
          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }
  }, [_shippingMethods, cart.id])

  const handleSubmit = () => {
    setIsLoading(true)
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSelect = async (methodId: string) => {
    setShippingMethodId(methodId)
    if (!isOpen) return
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: methodId })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (!availableShippingMethods) return null

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-gray-200 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-xs font-bold">
            2
          </div>
          <Heading level="h2" className="text-lg font-display font-bold text-gray-900">
            Delivery
          </Heading>
          {!isOpen && cart.shipping_methods?.length ? (
            <CheckCircleSolid className="text-green-500 w-5 h-5" />
          ) : null}
        </div>
        {!isOpen && cart?.shipping_methods?.length ? (
          <Text>
            <button
              onClick={() => router.push(pathname + "?step=delivery", { scroll: false })}
              className="text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
              data-testid="edit-delivery-button"
            >
              Edit
            </button>
          </Text>
        ) : null}
      </div>

      {isOpen ? (
        <>
          <div className="space-y-4">
            {_shippingMethods && _shippingMethods.length > 0 && (
              <div>
                <RadioGroup
                  value={shippingMethodId ?? undefined}
                  onChange={handleSelect}
                >
                  {_shippingMethods.map((option) => {
                    const isCalculated = option.price_type === "calculated"
                    const calculatedPrice = calculatedPricesMap[option.id]
                    const priceAmount = isCalculated
                      ? calculatedPrice ?? option.amount
                      : option.amount
                    const isSelected = shippingMethodId === option.id

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        className={clx(
                          "flex items-center gap-4 p-4 rounded-[var(--radius-md)] border transition-all duration-200 cursor-pointer mb-2",
                          isSelected
                            ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 ring-1 ring-[var(--color-brand)]"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                        data-testid="shipping-option"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500">
                          <Truck size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {option.name}
                          </p>
                          {priceAmount != null && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isCalculated && !calculatedPrice
                                ? "Calculating..."
                                : convertToLocale({
                                    amount: priceAmount,
                                    currency_code: cart?.currency_code,
                                  })}
                            </p>
                          )}
                        </div>
                        <MedusaRadio checked={isSelected} data-testid="shipping-option-radio" />
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            )}

            {hasPickupOptions && (
              <div className="mt-4">
                {showPickupOptions === PICKUP_OPTION_OFF ? (
                  <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border border-gray-200">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500">
                      <Store size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Pick up in store</p>
                      <p className="text-xs text-gray-500 mt-0.5">Available at select locations</p>
                    </div>
                    <button
                      onClick={() => setShowPickupOptions(PICKUP_OPTION_ON)}
                      className="text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
                    >
                      Show pickup options
                    </button>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={shippingMethodId ?? undefined}
                      onChange={handleSelect}
                    >
                      {_pickupMethods.map((option) => {
                        const isSelected = shippingMethodId === option.id
                        return (
                          <Radio
                            key={option.id}
                            value={option.id}
                            className={clx(
                              "flex items-center gap-4 p-4 rounded-[var(--radius-md)] border transition-all duration-200 cursor-pointer mb-2",
                              isSelected
                                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 ring-1 ring-[var(--color-brand)]"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                            data-testid="pickup-option"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500">
                              <Store size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {option.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {option.amount != null
                                  ? convertToLocale({
                                      amount: option.amount,
                                      currency_code: cart?.currency_code,
                                    })
                                  : "Free"}
                              </p>
                            </div>
                            <MedusaRadio checked={isSelected} data-testid="pickup-option-radio" />
                          </Radio>
                        )
                      })}
                    </RadioGroup>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="w-full sm:w-auto h-11 px-8 rounded-[var(--radius-sm)] text-sm font-bold tracking-wider shadow-sm hover:shadow-md transition-all duration-200"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-sm text-gray-500">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-full sm:w-1/3">
                <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                  Method
                </Text>
                <Text className="text-gray-500">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-6" />
    </div>
  )
}

export default Shipping
