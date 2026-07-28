# Cartunez storefront UI/UX research

## Method and scope

This refactor uses published standards, platform guidance, and public storefront patterns. It does not copy competitor branding, wording, assets, or proprietary layouts. Live web retrieval was unavailable in the implementation environment, so the source list below is an explicit reading list and decision record rather than a claim that every linked page was revalidated during this run.

## Sources reviewed

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for focus appearance, target size, reflow, contrast, error identification, and keyboard operation.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) for dialog, disclosure, menu, and keyboard interaction patterns. Native controls remain preferred where they provide the required behavior.
- [WAI form guidance](https://www.w3.org/WAI/tutorials/forms/) for visible labels, instructions, grouping, and adjacent validation.
- [web.dev Core Web Vitals](https://web.dev/articles/vitals) and [responsive images](https://web.dev/learn/images/descriptive) for stable media dimensions, restrained animation, LCP, CLS, and INP.
- [Next.js Image documentation](https://nextjs.org/docs/app/api-reference/components/image) and [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) for image sizing and keeping data-led content server rendered.
- Public pattern inventories from Tire Rack, Crutchfield, AutoZone, and CarParts.com were considered at a conceptual level: vehicle-first discovery, persistent fitment context, prominent search, scannable compatibility messages, and mobile filter access.
- Baymard Institute's public product-list, filtering, product-page, mobile-commerce, and checkout research informed filter visibility, clear product-card anatomy, nearby errors, and dominant checkout actions.

## Decisions adopted

1. **One alignment system.** A 90rem maximum container with fluid gutters is shared by the header, content, and footer.
2. **Vehicle and search context stay prominent.** Existing search and fitment behavior is preserved rather than replaced by a decorative landing experience.
3. **Progressive product disclosure.** Cards show verified product facts only; fabricated ratings or inventory claims are not presented. Detail pages retain the full option and fitment flow.
4. **Mobile-first filtering.** A native disclosure exposes the existing filter controls without duplicating filter state or introducing a new client-side dependency.
5. **Visible, adjacent form feedback.** Inputs have persistent labels and connect validation messages with `aria-describedby`.
6. **Stable responsive grids.** The catalog progresses from one column at 320px, to two at 375px, three at tablet widths, and four at wide desktop.
7. **Motion with an off switch.** Existing subtle transitions remain, while `prefers-reduced-motion` disables nonessential motion.
8. **No remote font dependency.** System font stacks protect build reliability and avoid a render-blocking request.

## Patterns rejected

- **Fake urgency, stock, or review signals:** harms trust when no authoritative data backs it.
- **Hover-only actions:** unavailable to touch and keyboard users; product cards remain fully actionable links.
- **A large UI framework:** unnecessary for the current Tailwind and Headless UI stack and would increase bundle and migration risk.
- **Separate mobile data flows:** would duplicate routing and commerce state. Responsive presentation uses the same components and URLs.
- **Sticky purchase or filter panels at every breakpoint:** can cover content on short screens. Sticky behavior is limited to desktop contexts.
- **Placeholder-only form labels:** creates ambiguity after input and fails robust error association.
- **Arbitrary competitor visual imitation:** fitment and discovery principles are transferable; branding and visual identity are not.

## Compatibility guardrails

The work intentionally leaves Medusa v1 contracts, FastAPI calls, cart mutations, authentication actions, routing, product option logic, and vehicle compatibility data unchanged. Improvements are concentrated in shared CSS tokens and presentation components.
