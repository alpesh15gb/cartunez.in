"use client"
import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard = !!(
    ((cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0) && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams ?? new URLSearchParams())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmitClick = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-gray-200 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-xs font-bold">
            3
          </div>
          <Heading level="h2" className="text-lg font-display font-bold text-gray-900">
            Payment
          </Heading>
          {!isOpen && paymentReady && (
            <CheckCircleSolid className="text-green-500 w-5 h-5" />
          )}
        </div>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {availablePaymentMethods && availablePaymentMethods.length > 0 && (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={setPaymentMethod}
            >
              {availablePaymentMethods.map((method) => {
                return (
                  <PaymentContainer
                    paymentProviderId={method.id}
                    key={method.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    paymentInfoMap={paymentInfoMap}
                  />
                )
              })}
            </RadioGroup>
          )}
          {isStripeLike(selectedPaymentMethod) && (
            <div className="my-4">
              <StripeCardContainer
                paymentProviderId={selectedPaymentMethod}
                selectedPaymentOptionId={selectedPaymentMethod}
                paymentInfoMap={paymentInfoMap}
                setCardBrand={setCardBrand}
                setCardComplete={setCardComplete}
                setError={setError}
              />
            </div>
          )}
          <ErrorMessage error={error} data-testid="payment-error-message" />
          <Button
            size="large"
            onClick={handleSubmitClick}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) &&
                !activeSession &&
                !cardComplete) ||
              (!isStripeLike(selectedPaymentMethod) &&
                !selectedPaymentMethod)
            }
            className="w-full sm:w-auto h-11 px-8 rounded-[var(--radius-sm)] text-sm font-bold tracking-wider shadow-sm hover:shadow-md transition-all duration-200 mt-4"
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              <div className="flex flex-col w-full sm:w-1/3">
                <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                  Payment method
                </Text>
                <Text
                  className="text-gray-500"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-full sm:w-1/3">
                <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 text-sm text-gray-500 items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-gray-100 rounded-[var(--radius-sm)]">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text className="text-gray-500">
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-full sm:w-1/3">
              <Text className="text-sm font-semibold text-gray-900 mb-1.5">
                Payment method
              </Text>
              <Text
                className="text-gray-500"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-6" />
    </div>
  )
}

export default Payment
