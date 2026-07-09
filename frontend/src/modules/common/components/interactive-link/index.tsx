import { ArrowUpRightMini } from "@medusajs/icons"
import LocalizedClientLink from "../localized-client-link"
type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="flex gap-x-1 items-center group text-brand hover:text-brand-dark transition-colors"
      href={href}
      onClick={onClick}
      {...props}
    >
      <span className="text-sm font-medium text-brand">{children}</span>
      <ArrowUpRightMini
        className="group-hover:rotate-45 ease-in-out duration-150"
        color="currentColor"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
