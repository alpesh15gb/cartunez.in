import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-5 flex items-center border-b border-gray-100 mb-5">
        <Heading className="text-2xl font-display font-bold text-gray-900 tracking-tight">
          Shopping Cart
        </Heading>
        {items && (
          <span className="ml-3 text-sm text-gray-400 font-medium bg-gray-50 px-2.5 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    currencyCode={cart?.currency_code}
                  />
                )
              })
          : repeat(5).map((i) => {
              return <SkeletonLineItem key={i} />
            })}
      </div>
    </div>
  )
}

export default ItemsTemplate
