import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@lib/seo/jsonld"
import { Inter } from "next/font/google"
import "styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Cartunez — Premium Car Accessories Online India",
    template: "%s | Cartunez",
  },
  description:
    "Upgrade your ride with premium automotive accessories. Shop car floor mats, LED headlights, Android stereo systems, seat covers & more at Cartunez.",
  keywords: [
    "car accessories",
    "premium car accessories",
    "luxury car accessories",
    "car floor mats",
    "LED car lights",
    "car seat covers",
    "dash camera",
    "Android car stereo",
    "car accessories India",
    "car mods Hyderabad",
    "cartunez",
  ],
  openGraph: {
    siteName: "Cartunez",
    type: "website",
    locale: "en_IN",
    title: "Cartunez — Premium Car Accessories Online India",
    description:
      "Upgrade your ride with premium automotive accessories. Shop car floor mats, LED headlights, Android stereo systems, seat covers & more.",
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 600,
        alt: "Cartunez - Premium Car Accessories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartunez — Premium Car Accessories Online India",
    description:
      "Upgrade your ride with premium automotive accessories.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
}

const jsonLd = {
  __html: [organizationJsonLd(), websiteJsonLd()].join(","),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `[${jsonLd.__html}]`,
          }}
        />
      </head>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
