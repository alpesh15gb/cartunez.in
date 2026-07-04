You will completely replace the existing storefront using the official Medusa DTC Starter as the new foundation.



Objective



Build a production-grade, premium automotive ecommerce storefront for Cartunez using the DTC Starter.



This is not a redesign of the existing frontend. The existing frontend has accumulated technical debt and UI issues. Treat the DTC Starter as the new base and build a completely new theme on top of it.



Existing Backend



Do NOT modify or break:



Medusa backend

FastAPI backend

PostgreSQL

Existing APIs

Existing business logic



The storefront must connect to the existing backend.



No dummy APIs.



No mock services.



No temporary endpoints.



Everything must use the real backend.



Existing Frontend



Ignore the old frontend implementation.



i have renamed the current frontend folder to frontend-old.



Create a completely new frontend from the DTC Starter.Already Downloaded in frontend folder 



Do not copy UI from the old project.



Only reuse assets if genuinely needed (logo, images, etc.).



Theme



Create a brand-new premium automotive theme.



Do NOT resemble the default DTC Starter.



Do NOT resemble the previous Cartunez frontend.



The finished storefront should look like a professionally designed automotive ecommerce website.



Requirements:



Premium

Modern

Responsive

Fast

Clean

Minimal

Automotive-focused



Desktop, tablet, and mobile must all be first-class experiences.



Absolutely No Fake Data



This is critical.



Do NOT create:



mock data

fake products

placeholder JSON

temporary arrays

hardcoded products

sample categories

demo reviews

fake banners

fake pricing



Every screen must load data from the actual backend.



If backend data is unavailable, display proper loading, empty, or error states.



Never fabricate data to make a page "look complete."



Homepage



Design a completely new homepage.



Include:



Premium hero section

Vehicle finder

Featured categories

Featured brands

New arrivals

Best sellers

Promotional banners

Customer reviews

Why choose Cartunez

Newsletter

Footer



Do not copy the DTC demo homepage.



Product Page



Completely redesign.



Include:



Premium gallery

Sticky purchase panel

Variant selection

Vehicle compatibility

Specifications

Description

Reviews

Related products

Frequently bought together

Shipping information

Category Pages



Build premium listing pages with:



Filters

Sorting

Pagination or infinite scroll

Mobile filter drawer

Search

Brand filters

Price filters

Navigation



Create a completely custom navigation.



Desktop:



Mega menu

Sticky header

Search

Wishlist

Cart

Account



Mobile:



Bottom navigation

Hamburger menu

Smooth animations

Visual Design



Develop a complete design system.



Do not reuse the DTC styling.



Create:



Typography

Color palette

Components

Buttons

Cards

Inputs

Dialogs

Modals

Icons

Animations



Everything should feel like one cohesive premium brand.



Performance

Server Components where appropriate

Lazy loading

Optimized images

Skeleton loaders

Responsive images

Code splitting

Excellent Lighthouse scores

Code Quality

TypeScript only

No any

No unused code

No dead components

No duplicate files

No TODOs

No FIXME comments

No console.log statements

No commented-out code

Existing Functionality



Verify and connect:



Login

Registration

Products

Categories

Collections

Search

Cart

Checkout

Orders

Customer account

Addresses

Payments



Everything must work against the live backend.



Before Completion



Verify:



No mock data anywhere.

No placeholder UI.

No broken images.

No broken routes.

No unused components.

No compile warnings.

No TypeScript errors.

No lint errors.

Fully responsive.

Production-ready.



The goal is not to customize the DTC Starter. The goal is to use it only as the technical foundation while creating a completely original, premium Cartunez storefront that is stable, maintainable, and fully connected to the existing Medusa and FastAPI backends.

