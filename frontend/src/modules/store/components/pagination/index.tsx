"use client"

import { clx } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Pagination({
  page,
  totalPages,
  'data-testid': dataTestid
}: {
  page: number
  totalPages: number
  'data-testid'?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Helper function to generate an array of numbers within a range
  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams ?? new URLSearchParams())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Function to render a page button
  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      className={clx(
        "relative inline-flex items-center justify-center min-w-[40px] h-10 rounded-[var(--radius-full)] text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/15",
        isCurrent
          ? "bg-[var(--color-brand)] text-white shadow-md hover:bg-[var(--color-brand-dark)]"
          : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
      )}
      disabled={isCurrent}
      onClick={() => handlePageChange(p)}
    >
      {label}
    </button>
  )

  // Function to render ellipsis
  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="inline-flex items-center justify-center w-10 h-10 text-xs font-bold text-gray-300 cursor-default select-none"
    >
      ...
    </span>
  )

  // Function to render page buttons based on the current page and total pages
  const renderPageButtons = () => {
    const buttons = []

    if (totalPages <= 7) {
      // Show all pages
      buttons.push(
        ...arrayRange(1, totalPages).map((p) =>
          renderPageButton(p, p, p === page)
        )
      )
    } else {
      // Handle different cases for displaying pages and ellipses
      if (page <= 4) {
        // Show 1, 2, 3, 4, 5, ..., lastpage
        buttons.push(
          ...arrayRange(1, 5).map((p) => renderPageButton(p, p, p === page))
        )
        buttons.push(renderEllipsis("ellipsis1"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
      } else if (page >= totalPages - 3) {
        // Show 1, ..., lastpage - 4, lastpage - 3, lastpage - 2, lastpage - 1, lastpage
        buttons.push(renderPageButton(1, 1, 1 === page))
        buttons.push(renderEllipsis("ellipsis2"))
        buttons.push(
          ...arrayRange(totalPages - 4, totalPages).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
      } else {
        // Show 1, ..., page - 1, page, page + 1, ..., lastpage
        buttons.push(renderPageButton(1, 1, 1 === page))
        buttons.push(renderEllipsis("ellipsis3"))
        buttons.push(
          ...arrayRange(page - 1, page + 1).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
        buttons.push(renderEllipsis("ellipsis4"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
      }
    }

    return buttons
  }

  // Render the component
  return (
    <div className="flex justify-center w-full mt-12" data-testid={dataTestid}>
      <nav className="flex items-center gap-2" aria-label="Pagination">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className={clx(
            "inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-full)] text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/15",
            page <= 1
              ? "text-gray-300 cursor-not-allowed bg-transparent"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">{renderPageButtons()}</div>

        {/* Next button */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className={clx(
            "inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-full)] text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand)]/15",
            page >= totalPages
              ? "text-gray-300 cursor-not-allowed bg-transparent"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
          )}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  )
}
