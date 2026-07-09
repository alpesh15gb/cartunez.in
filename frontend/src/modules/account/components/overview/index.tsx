import { ArrowUpRightMini } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Package from "@modules/common/icons/package"
import MapPin from "@modules/common/icons/map-pin"
import User from "@modules/common/icons/user"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileCompletion = getProfileCompletion(customer)
  const addressCount = customer?.addresses?.length || 0
  const orderCount = orders?.length || 0

  const quickActions = [
    {
      label: "Edit Profile",
      href: "/account/profile",
      icon: User,
      desc: "Update your name, email, and phone",
    },
    {
      label: "Manage Addresses",
      href: "/account/addresses",
      icon: MapPin,
      desc: addressCount === 1 ? "1 saved address" : addressCount + " saved addresses",
    },
    {
      label: "View Orders",
      href: "/account/orders",
      icon: Package,
      desc: orderCount === 1 ? "1 order placed" : orderCount + " orders placed",
    },
  ]

  return (
    <div data-testid="overview-page-wrapper" className="space-y-8">
      {/* Welcome Card */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              data-testid="welcome-message"
              data-value={customer?.first_name}
            >
              Welcome back{customer?.first_name ? ", " + customer.first_name : ""}
              <span className="inline-block ml-2">👋</span>
            </h1>
            <p className="text-gray-300 text-sm mt-1.5">
              Here&apos;s what&apos;s happening with your account today.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <span className="text-xs text-gray-300">Signed in as</span>
            <span
              className="text-sm font-semibold text-white"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          label="Profile Completion"
          value={profileCompletion + "%"}
          icon={User}
          subtext={profileCompletion < 100 ? "Complete your profile" : "All done!"}
          highlight={profileCompletion < 100}
          data-testid="customer-profile-completion"
          data-value={profileCompletion}
        />
        <StatCard
          label="Saved Addresses"
          value={String(addressCount)}
          icon={MapPin}
          subtext={addressCount === 0 ? "Add an address" : addressCount + " on file"}
          data-testid="addresses-count"
          data-value={addressCount}
        />
        <StatCard
          label="Total Orders"
          value={String(orderCount)}
          icon={Package}
          subtext={orderCount === 0 ? "Start shopping" : orderCount + " placed"}
          data-testid="orders-count"
          data-value={orderCount}
        />
      </div>

      {/* Recent Orders + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              {orderCount > 0 && (
                <LocalizedClientLink
                  href="/account/orders"
                  className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowUpRightMini className="w-3.5 h-3.5" />
                </LocalizedClientLink>
              )}
            </div>

            {orders && orders.length > 0 ? (
              <ul className="space-y-3" data-testid="orders-wrapper">
                {orders.slice(0, 5).map((order) => {
                  return (
                    <li
                      key={order.id}
                      data-testid="order-wrapper"
                      data-value={order.id}
                    >
                      <LocalizedClientLink
                        href={"/account/orders/details/" + order.id}
                        className="block group"
                      >
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-100/80 group-hover:bg-gray-50 group-hover:border-gray-200 transition-all duration-200">
                          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Date placed
                              </p>
                              <p
                                className="text-gray-900 font-medium"
                                data-testid="order-created-date"
                              >
                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Order
                              </p>
                              <p
                                className="text-gray-900 font-medium"
                                data-testid="order-id"
                                data-value={order.display_id}
                              >
                                #{order.display_id}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Total
                              </p>
                              <p
                                className="text-gray-900 font-semibold"
                                data-testid="order-amount"
                              >
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4">
                            <ArrowUpRightMini className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors duration-200" />
                          </div>
                        </div>
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-center py-12" data-testid="no-orders-message">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No recent orders</p>
                <p className="text-gray-400 text-sm mt-1">
                  Start shopping to see your orders here.
                </p>
                <LocalizedClientLink
                  href="/store"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  Browse products
                  <ArrowUpRightMini className="w-3.5 h-3.5" />
                </LocalizedClientLink>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <LocalizedClientLink
                  key={action.href}
                  href={action.href}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-brand transition-colors duration-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-brand transition-colors duration-200">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowUpRightMini className="w-4 h-4 text-gray-300 group-hover:text-brand mt-1 transition-colors duration-200 shrink-0" />
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Sub-component
type StatCardProps = {
  label: string
  value: string
  icon: React.FC<{ size?: number; className?: string }>
  subtext: string
  highlight?: boolean
  "data-testid"?: string
  "data-value"?: string | number
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  subtext,
  highlight,
  "data-testid": dataTestId,
  "data-value": dataValue,
}: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div
          className={
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " +
            (highlight ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500")
          }
        >
          <Icon size={18} />
        </div>
      </div>
      <p
        className="text-3xl font-bold text-gray-900 tracking-tight"
        data-testid={dataTestId}
        data-value={dataValue}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview

