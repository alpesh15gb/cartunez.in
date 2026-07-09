import React from "react"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen" data-testid="account-page">
      <div className="content-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Sidebar / Mobile Tabs */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {customer && <AccountNav customer={customer} />}
          </div>

          {/* Main Content Area */}
          <div className="min-h-[60vh]">{children}</div>
        </div>

        {/* Footer Section */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                Got questions?
              </h3>
              <Text className="text-gray-500 text-sm">
                You can find frequently asked questions and answers on our
                customer service page.
              </Text>
            </div>
            <LocalizedClientLink
              href="/customer-service"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors duration-200"
            >
              Customer Service
              <ArrowUpRightMini className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout