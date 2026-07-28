# Cartunez storefront UI/UX audit

## Audit scope

The review covered App Router pages and shared modules for home, store, categories, collections, products, cart, checkout, account, orders, search, fitment, navigation, footer, modals, forms, loading skeletons, errors, and empty states. Priorities reflect customer impact and implementation risk.

| Page or component | Current problem | User impact | Responsive impact | Accessibility impact | Recommended correction | Priority |
|---|---|---|---|---|---|---|
| Global container | Several sections used local widths while `.content-container` clipped horizontal overflow. | Boundaries felt inconsistent and overlays could be cut off. | Gutters changed unpredictably. | Clipping can hide focused content. | Use one fluid-gutter, 90rem container and clip only at the document boundary. | Critical |
| Global tokens | Duplicate root font variables silently replaced offline stacks; spacing and layer values were scattered. | Typography varied between surfaces. | One-off values produced uneven rhythm. | Inconsistent focus/overlay layers can obscure controls. | Consolidate fonts, layout, control, motion, and z-index tokens. | High |
| Header/navigation | Action targets were 40px and duplicate transition utilities were present. | Controls were harder to tap and hierarchy felt cramped. | Tight mobile header increased mistaps. | Targets missed the preferred 44px baseline. | Use shared 44px icon buttons and a documented header layer. | High |
| Mobile menu | The existing Headless UI popover supplies core semantics, but long-menu and viewport-height behavior needs browser regression coverage. | Long navigation may be cumbersome. | Short landscape screens are highest risk. | Focus management must be verified in a real browser. | Retain Headless UI behavior; add viewport scrolling and automated interaction coverage next. | High |
| Search | Search is prominent but overlay bounds and close affordances depended on the generic modal. | Results could be hard to dismiss or scroll. | 75vh panels clipped on small screens. | Close button lacked an accessible name. | Make modal viewport-safe, scrollable, Escape-capable through Headless UI, and label close control. | Critical |
| Footer newsletter | Email relied on placeholder/ARIA label and lacked autocomplete metadata. | Entry purpose became unclear after typing. | Stacked layout was usable but targets varied. | No persistent visible/associated label; social targets were 36px. | Add associated label, name, autocomplete, and 44px social targets. | High |
| Footer social links | Placeholder `#` destinations are nonfunctional. | Users receive no destination. | No unique responsive effect. | Links expose actions that do nothing. | Replace with verified organization URLs or remove in a content-managed follow-up. | Medium |
| Generic modal | Panel could not scroll and close button was unnamed and undersized. | Content could become unreachable. | Severe on 320px/short screens. | Dialog dismissal was not announced clearly. | Use dynamic viewport height, overscroll containment, visible focus, and labeled 44px close button. | Critical |
| Shared input | Input `id` was absent, labels did not reliably associate, and error props were unused. | Forms gave weak recovery guidance. | Floating label could collide with long text. | Failed label, invalid-state, and error-description relationships. | Use persistent labels, generated IDs, `aria-invalid`, adjacent live errors, and labeled password toggle. | Critical |
| Product listing filters | Desktop sidebar remained the primary pattern; mobile controls lacked a clear grouped entry point. | Filters were difficult to discover. | Sidebar consumed space before desktop breakpoint. | Filter group had no landmark. | Add a native mobile disclosure and labeled desktop aside without duplicating logic. | High |
| Product grid | Two columns at 320px compressed cards; gap rules used project-specific breakpoints inconsistently. | Titles and prices became cramped. | High overflow/clipping risk at 320px. | Dense targets reduce readability. | Use 1/2/3/4-column responsive grid with consistent gaps. | Critical |
| Product cards | Fixed minimum height, fabricated 4.0 rating, and unverified “In stock” badge. | Misleading claims undermine trust; cards were too tall on narrow screens. | Fixed height magnified small-screen imbalance. | Decorative star output lacked an authentic accessible value. | Remove unverified claims, allow content-led height, and show explicit unavailable-price state. | Critical |
| Product results | Region-loading failure returned no UI. | Store appeared blank with no recovery path. | Blank state affected every viewport. | No announced failure. | Render an alert-style service state with actionable guidance. | High |
| No-results state | Existing state was useful but used a bespoke shell. | Acceptable, but visually divergent. | Padding was large on phones. | Semantics were mostly sound. | Reuse the shared empty-state surface and keep clear-filters action. | Medium |
| Product detail | Image, information, fitment, options, and purchase controls use several independent spacing rules. | Purchase hierarchy can feel fragmented. | Sticky/side-by-side behavior needs real-device verification. | Heading and option group labeling need route-level testing. | Align to global container and validate stacking/focus with live product data. | High |
| Product-detail trust content | Hard-coded customer counts, warranty periods, shipping thresholds, and guarantee language were not connected to authoritative commerce data. | Unsupported claims can mislead customers and become stale. | Dense promotional blocks lengthened the mobile purchase flow. | Repetitive promotional text delayed access to compatibility and reviews. | Replace unsupported claims with neutral checkout, compatibility, support, and delivery guidance. | Critical |
| Vehicle compatibility | Fitment is strategically important but presentation varies between header/search/product modules. | Users can lose confidence about vehicle context. | Long make/model names may wrap. | Status changes need screen-reader announcements. | Standardize fitment status language and add live-region coverage without changing vehicle APIs. | High |
| Cart items/summary | Multiple templates use independent width and spacing decisions. | Totals and item actions compete for attention. | Long titles can compress controls. | Quantity/remove labeling needs browser-level assertions. | Align to global grid, protect action width, and keep checkout dominant. | High |
| Checkout forms | Shared input defects propagated to address/account fields. | Error correction was difficult. | Floating labels could overlap. | Missing robust label/error association. | Shared input correction addresses the base issue; audit specialized selects and payment widgets with live providers. | Critical |
| Account/authentication | Dense form layouts inherit inconsistent controls. | Login and profile tasks feel less polished. | Narrow layouts need consistent spacing. | Password toggle was unnamed. | Adopt corrected shared fields and verify autocomplete per form. | High |
| Loading/skeletons | Skeleton dimensions do not always match the final responsive grid. | Content shifts as products load. | Most visible during column changes. | Loading status is not consistently announced. | Match `.product-grid` geometry and add concise status text. | Medium |
| Error/404 routes | Visual treatment varies and recovery actions are inconsistent. | Users may reach dead ends. | Some large headings dominate phones. | Heading hierarchy/recovery link consistency varies. | Use the shared empty-state pattern and one clear route back. | Medium |
| Focus and motion | Focus was globally present, but motion had no reduced-motion override. | Motion-sensitive users could experience discomfort. | Hover transforms add little on touch. | WCAG motion preference was not honored. | Add reduced-motion override while retaining visible focus. | High |
| Static/content routes | Content width and heading scale vary by page. | Reading rhythm is inconsistent. | Wide text lines reduce readability. | Heading order must be checked per route. | Use the shared container and cap prose width; verify headings during content review. | Medium |

## Implemented in this refactor

- Unified layout, spacing, typography, control, motion, and layer tokens.
- Shared container, section, grid, surface, empty-state, icon-button, and field-control utilities.
- Viewport-safe modal scrolling and accessible dismissal.
- Persistent input labels, associated errors, and accessible password visibility control.
- 44px header/footer action targets.
- Responsive mobile filter disclosure and stable product grid.
- Removal of fabricated product reviews and inventory messages.
- Explicit region failure and unavailable-price states.
- Mobile navigation now uses dynamic viewport height, safe-area padding, named controls, and 44px close/menu targets.
- Cart quantity controls now have 44px targets, product-specific accessible names, polite quantity updates, and announced errors.
- Product-detail support content no longer makes unverified customer-count, warranty, fitment-guarantee, or shipping claims.

## Validation matrix

The CSS grid was defined for 320, 375, tablet, and wide breakpoints. Required visual targets are 320, 375, 430, 768, 1024, 1280, 1440, and 1920 pixels. Automated static checks can prove token and semantic wiring, but overlap, focus restoration, provider widgets, and real product-title wrapping require a running Medusa-backed storefront and browser inspection. Those checks must not be represented as completed unless screenshots are captured from that environment.

## Remaining work requiring live systems

1. Validate every checkout payment-provider state with sandbox credentials.
2. Verify vehicle selector announcements and long vehicle names using production-shaped data.
3. Replace placeholder footer social URLs with verified organization profiles.
4. Add browser-level keyboard and focus-restoration tests once the repository has a browser-test runner.
5. Capture the full viewport matrix against representative home, listing, product, cart, account, and checkout routes.
