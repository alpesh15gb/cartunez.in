export type Id = string

export interface StoreApiErrorBody {
  code?: string
  type?: string
  message?: string
  errors?: Record<string, string[]>
  request_id?: string
}

export interface MoneyAmount {
  id?: Id
  amount: number
  currency_code: string
  region_id?: Id | null
  min_quantity?: number | null
  max_quantity?: number | null
  price_rules?: Array<{ attribute: string; operator: string; value: string }>
}

export type StorePrice = MoneyAmount

export interface Currency {
  code: string
  symbol?: string
  symbol_native?: string
  name?: string
}

export interface Country {
  id?: Id
  iso_2: string
  iso_3?: string
  name?: string
  display_name?: string
}

export interface PaymentProvider { id: Id; is_installed?: boolean }
export interface FulfillmentProvider { id: Id; is_installed?: boolean }

export interface StoreRegion {
  id: Id
  name: string
  currency_code: string
  currency?: Currency
  tax_rate?: number
  tax_code?: string | null
  gift_cards_taxable?: boolean
  automatic_taxes?: boolean
  countries?: Country[]
  payment_providers?: PaymentProvider[]
  fulfillment_providers?: FulfillmentProvider[]
}

export interface StoreProductImage { id: Id; url: string; rank?: number }

export interface StoreProductOptionValue {
  id: Id
  value: string
  option_id?: Id
  variant_id?: Id
  option?: StoreProductOption
}

export interface StoreProductOption {
  id: Id
  title: string
  product_id?: Id
  values?: StoreProductOptionValue[]
}

export interface StoreProductVariant {
  id: Id
  title: string
  product_id?: Id
  sku?: string | null
  barcode?: string | null
  ean?: string | null
  upc?: string | null
  inventory_quantity?: number
  allow_backorder?: boolean
  manage_inventory?: boolean
  prices?: MoneyAmount[]
  calculated_price?: number
  original_price?: number
  images?: StoreProductImage[]
  options?: StoreProductOptionValue[]
  product?: StoreProduct
  metadata?: Record<string, unknown> | null
}

export interface StoreProductCategory {
  id: Id
  name: string
  handle: string
  description?: string
  parent_category_id?: Id | null
  parent_category?: StoreProductCategory | null
  category_children?: StoreProductCategory[]
  rank?: number
  metadata?: Record<string, unknown> | null
  products?: StoreProduct[]
}

export interface StoreCollection {
  id: Id
  title: string
  handle: string
  metadata?: Record<string, unknown> | null
  products?: StoreProduct[]
}

export interface StoreProduct {
  id: Id
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  status?: string
  thumbnail?: string | null
  images?: StoreProductImage[]
  options?: StoreProductOption[]
  variants?: StoreProductVariant[]
  collection_id?: Id | null
  collection?: StoreCollection | null
  categories?: StoreProductCategory[]
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  material?: string | null
  origin_country?: string | null
  hs_code?: string | null
  mid_code?: string | null
  type?: { id: Id; value?: string } | null
  tags?: Array<{ id: Id; value: string }>
}

export interface StoreCustomerAddress {
  id: Id
  customer_id?: Id
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  phone?: string | null
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

export type StoreCartAddress = StoreCustomerAddress

export interface StoreCustomer {
  id: Id
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  billing_address_id?: Id | null
  billing_address?: StoreCustomerAddress | null
  shipping_addresses?: StoreCustomerAddress[]
  orders?: StoreOrder[]
  metadata?: Record<string, unknown> | null
}

export interface DiscountRule { type?: string; value?: number; allocation?: string }
export interface Discount { id: Id; code: string; rule?: DiscountRule }
export interface GiftCard { id: Id; code?: string; balance?: number; value?: number }

export interface StoreCartLineItem {
  id: Id
  cart_id?: Id
  title: string
  description?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  subtotal?: number
  total?: number
  tax_total?: number
  discount_total?: number
  variant_id?: Id | null
  variant?: StoreProductVariant
  product?: StoreProduct
  metadata?: Record<string, unknown> | null
  original_total?: number
  created_at?: string
}

export interface StoreShippingOption {
  id: Id
  name: string
  region_id?: Id
  provider_id?: Id
  amount?: number
  price_type?: string
  data?: Record<string, unknown>
  prices?: MoneyAmount[]
}

export type StoreCartShippingOption = StoreShippingOption

export interface StoreShippingMethod {
  id: Id
  shipping_option_id?: Id
  option?: StoreShippingOption
  price: number
  name?: string
  amount?: number
  total?: number
  data?: Record<string, unknown>
}

export interface StorePaymentSession {
  id: Id
  provider_id: Id
  status?: string
  amount: number
  data?: Record<string, unknown>
  is_selected?: boolean
  created_at?: string
}

export interface StoreCart {
  id: Id
  region_id: Id
  region?: StoreRegion
  email?: string | null
  customer_id?: Id | null
  customer?: StoreCustomer | null
  items?: StoreCartLineItem[]
  shipping_address_id?: Id | null
  shipping_address?: StoreCartAddress | null
  billing_address_id?: Id | null
  billing_address?: StoreCartAddress | null
  shipping_methods?: StoreShippingMethod[]
  payment_sessions?: StorePaymentSession[]
  payment_session?: StorePaymentSession | null
  discounts?: Discount[]
  gift_cards?: GiftCard[]
  currency_code: string
  subtotal?: number
  discount_total?: number
  gift_card_total?: number
  shipping_total?: number
  tax_total?: number
  total?: number
  item_total?: number
}

export type StoreOrderLineItem = StoreCartLineItem

export interface StoreOrder {
  id: Id
  display_id?: number
  cart_id?: Id
  email?: string
  currency_code: string
  status: string
  fulfillment_status: string
  payment_status: string
  customer_id?: Id | null
  customer?: StoreCustomer | null
  items?: StoreOrderLineItem[]
  shipping_address?: StoreCartAddress | null
  billing_address?: StoreCartAddress | null
  shipping_methods?: StoreShippingMethod[]
  payments?: StorePaymentSession[]
  discounts?: Discount[]
  gift_cards?: GiftCard[]
  subtotal?: number
  discount_total: number
  gift_card_total: number
  shipping_total?: number
  tax_total?: number
  total: number
  created_at: string
}

export interface StoreCartResponse { cart: StoreCart }
export interface StoreOrderResponse { order: StoreOrder }
export interface StoreOrderListResponse { orders: StoreOrder[]; count: number; offset: number; limit: number }
export interface StoreCollectionListResponse { collections: StoreCollection[]; count: number; offset: number; limit: number }
export interface StoreProductCategoryListResponse { product_categories: StoreProductCategory[]; count: number; offset: number; limit: number }
export interface StorePaymentProviderListResponse { payment_providers: PaymentProvider[] }
export interface StoreShippingOptionListResponse { shipping_options: StoreShippingOption[] }

export interface FindParams { limit?: number; offset?: number; q?: string; id?: string | string[]; fields?: string; expand?: string }
export interface StoreProductListParams extends FindParams {
  region_id?: Id
  collection_id?: Id | Id[]
  category_id?: Id | Id[]
  handle?: string
  order?: string
  tag_id?: Id | Id[]
  is_giftcard?: boolean
}

export interface StoreUpdateCart {
  region_id?: Id
  email?: string
  shipping_address?: Partial<StoreCartAddress> | Id
  billing_address?: Partial<StoreCartAddress> | Id
  discounts?: Array<{ code: string }>
}

export interface StoreUpdateCustomer {
  first_name?: string
  last_name?: string
  phone?: string
  password?: string
  billing_address?: Partial<StoreCustomerAddress>
}

export type StoreUpdateCustomerAddress = Partial<StoreCustomerAddress>
export interface StoreInitializePaymentSession { provider_id: Id; data?: Record<string, unknown> }
