import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

/* ─── Icon Components ─────────────────────────────────────────── */

const Instagram = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YouTube = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const TwitterX = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
  </svg>
);

const PaymentBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center justify-center h-8 px-3.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:border-white/20 transition-colors duration-200">
    {label}
  </span>
);

/* ─── Main Footer Component ───────────────────────────────────── */

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void collections;
  const productCategories = await listCategories();

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    { label: "Account", href: "/account" },
    { label: "Cart", href: "/cart" },
  ];

  const supportLinks = [
    { label: "Book Installation", href: "/book-installation" },
    { label: "Customer Helpdesk", href: "/support" },
    { label: "Store Catalog", href: "/store" },
    { label: "Returns & Exchanges", href: "/returns" },
  ];

  const socialLinks = [
    { label: "Instagram", href: "#", icon: <Instagram /> },
    { label: "Facebook", href: "#", icon: <Facebook /> },
    { label: "YouTube", href: "#", icon: <YouTube /> },
    { label: "X (Twitter)", href: "#", icon: <TwitterX /> },
  ];

  const paymentMethods = ["Visa", "Mastercard", "UPI", "PayPal", "Amex"];

  return (
    <footer className="bg-[var(--color-carbon-dark)] w-full text-gray-400">
      {/* ─── Newsletter ──────────────────────────────────────────── */}
      <div className="border-b border-white/[0.04]">
        <div className="content-container py-12 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-[0.2em] block font-[var(--font-display)]">
                Stay in the loop
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-[var(--font-display)] uppercase tracking-tight">
                Drive into the <span className="text-[var(--color-brand)]">Latest</span>
              </h3>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                Get exclusive access to new releases, limited drops, and build
                tips straight to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-11 sm:h-12 px-4 bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-sm)] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all duration-200"
                />
              </div>
              <button className="h-11 sm:h-12 px-6 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold uppercase tracking-[0.12em] rounded-[var(--radius-sm)] transition-all duration-200 whitespace-nowrap shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Links Grid ─────────────────────────────────────── */}
      <div className="border-b border-white/[0.04]">
        <div className="content-container py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 space-y-5">
              <LocalizedClientLink
                href="/"
                className="inline-flex items-center gap-1.5 group"
              >
                <span className="text-lg font-black uppercase tracking-tighter text-white font-[var(--font-display)]">
                  <span className="text-[var(--color-brand)]">Car</span>Tunez
                </span>
              </LocalizedClientLink>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
                Premium automotive performance parts &amp; accessories for
                enthusiasts who demand the best.
              </p>
              <div className="flex items-center gap-2.5">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] border border-white/[0.06] text-gray-500 hover:text-white hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-brand)]/10 transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em] block font-[var(--font-display)]">
                Quick Links
              </span>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <LocalizedClientLink
                      href={link.href}
                      className="text-xs text-gray-500 font-medium hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em] block font-[var(--font-display)]">
                Categories
              </span>
              <ul className="space-y-2.5" data-testid="footer-categories">
                {productCategories?.slice(0, 6).map((c) => {
                  if (c.parent_category) return null;
                  return (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/categories/${c.handle}`}
                        className="text-xs text-gray-500 font-medium hover:text-white transition-colors duration-200"
                        data-testid="category-link"
                      >
                        {c.name}
                      </LocalizedClientLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em] block font-[var(--font-display)]">
                Support
              </span>
              <ul className="space-y-2.5">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <LocalizedClientLink
                      href={link.href}
                      className="text-xs text-gray-500 font-medium hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Payment Methods ─────────────────────────────────────── */}
      <div className="border-b border-white/[0.04]">
        <div className="content-container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] font-[var(--font-display)]">
              We Accept
            </span>
            <div className="flex items-center gap-2.5">
              {paymentMethods.map((pm) => (
                <PaymentBadge key={pm} label={pm} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Copyright Bar ───────────────────────────────────────── */}
      <div className="content-container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-600 font-medium">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Cartunez. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <LocalizedClientLink
              href="/privacy-policy"
              className="hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/terms-of-service"
              className="hover:text-white transition-colors duration-200"
            >
              Terms of Service
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
