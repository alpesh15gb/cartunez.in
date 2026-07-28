const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const { test } = require("node:test")

const root = join(__dirname, "../..")
const source = (path) => readFileSync(join(root, path), "utf8")

test("shared layout tokens cover responsive gutters, grids, and reduced motion", () => {
  const css = source("src/styles/globals.css")
  assert.match(css, /--layout-max: 90rem/)
  assert.match(css, /--page-gutter: clamp\(/)
  assert.match(css, /min-\[375px\]:grid-cols-2/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test("modal dismissal and password visibility controls have accessible names", () => {
  const modal = source("src/modules/common/components/modal/index.tsx")
  const input = source("src/modules/common/components/input/index.tsx")
  assert.match(modal, /aria-label="Close dialog"/)
  assert.match(modal, /max-h-\[calc\(100dvh-2rem\)\]/)
  assert.match(input, /aria-label=\{showPassword \? "Hide password" : "Show password"\}/)
  assert.match(input, /aria-describedby=\{error \? errorId : undefined\}/)
})

test("catalog offers mobile filters and does not show fabricated ratings or stock", () => {
  const store = source("src/modules/store/templates/index.tsx")
  const card = source("src/modules/products/components/product-preview/index.tsx")
  assert.match(store, /<details className="surface-card group lg:hidden">/)
  assert.doesNotMatch(card, /\(4\.0\)/)
  assert.doesNotMatch(card, />\s*In stock\s*</)
})

test("navigation and cart controls expose mobile-safe and named interactions", () => {
  const menu = source("src/modules/layout/components/side-menu/index.tsx")
  const item = source("src/modules/cart/components/item/index.tsx")
  assert.match(menu, /h-dvh max-h-dvh/)
  assert.match(menu, /aria-label=\{open \? "Close navigation menu" : "Open navigation menu"\}/)
  assert.match(item, /aria-label=\{`Decrease quantity of \$\{item\.title\}`\}/)
  assert.match(item, /aria-label=\{`Increase quantity of \$\{item\.title\}`\}/)
  assert.match(item, /role="alert"/)
})

test("product detail does not publish unsupported trust claims", () => {
  const product = source("src/modules/products/templates/index.tsx")
  assert.doesNotMatch(product, /10,000\+ Happy/)
  assert.doesNotMatch(product, /1-year manufacturer warranty/)
  assert.doesNotMatch(product, /Fitment Guarantee/)
  assert.doesNotMatch(product, /Free Express Shipping/)
})
