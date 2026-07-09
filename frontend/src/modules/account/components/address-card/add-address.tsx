"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@modules/common/components/ui"
import { useActionState, useEffect, useState } from "react"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"

const AddAddress = ({
  region,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        className="border-2 border-dashed border-gray-200 rounded-[var(--radius-lg)] p-6 min-h-[220px] h-full w-full flex flex-col items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 group"
        onClick={open}
        data-testid="add-address-button"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[var(--color-brand)]/10 transition-colors duration-200">
          <Plus className="text-gray-400 group-hover:text-[var(--color-brand)] transition-colors duration-200" />
        </div>
        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors duration-200">New address</span>
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <Heading className="text-lg font-bold text-gray-900 mb-2">Add address</Heading>
        </Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-3">
              <div className="grid grid-cols-2 gap-x-3">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />
              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-3">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="locality"
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
              />
              <Input
                label="Phone"
                name="phone"
                autoComplete="phone"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="text-rose-500 text-sm py-2"
                data-testid="address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10 rounded-[var(--radius-sm)]"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <SubmitButton data-testid="save-button" className="rounded-[var(--radius-sm)]">Save</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress