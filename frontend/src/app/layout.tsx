import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Barlow_Condensed, Inter } from "next/font/google"
import "styles/globals.css"

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={`${barlow.variable} ${inter.variable}`}>
      <body className="font-sans bg-carbon antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
