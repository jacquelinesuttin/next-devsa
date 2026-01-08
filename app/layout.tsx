import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Footer } from "@/components/footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://devsa.community"

export const metadata: Metadata = {
  title: "DEVSA - Your Direct Connection to the Tech Community in San Antonio",
  description: "You're absolutely right! DEVSA bridges the gap between passionate builders, local partners, and the growing tech ecosystem in San Antonio.",
  keywords: [
    "San Antonio tech community",
    "DEVSA",
    "developers San Antonio",
    "tech meetups SA",
    "programming community",
    "software developers",
    "tech networking",
    "San Antonio startups",
    "coding community",
    "tech events San Antonio",
    "tech collaboration",
    "strategic partnerships",
    "video content",
    "innovation San Antonio",
    "tech groups SA",
    "developer community",
    "technology partnerships",
    "Alamo City tech",
    "SA tech scene",
    "tech ecosystem San Antonio",
  ],
  authors: [{ name: "DEVSA Community" }],
  creator: "DEVSA",
  publisher: "DEVSA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DEVSA - Your Direct Connection to the Tech Community",
    description:
      "You're absolutely right! DEVSA bridges the gap between passionate builders, local partners, and the growing tech ecosystem in San Antonio.",
    url: siteUrl,
    siteName: "DEVSA",
    images: [
      {
        url: `${siteUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "DEVSA - Your Direct Connection to the Tech Community in San Antonio",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DEVSA - Your Direct Connection to the Tech Community",
    description:
      "You're absolutely right! DEVSA bridges the gap between passionate builders, local partners, and the growing tech ecosystem in San Antonio.",
    images: [`${siteUrl}/opengraph-image.png`],
    creator: "@devsatx",
    site: "@devsatx",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DEVSA",
              alternateName: "DEV San Antonio",
              description:
                "You're absolutely right! DEVSA bridges the gap between passionate builders, local partners, and the growing tech ecosystem in San Antonio.",
              url: "https://devsa.community",
              logo: "https://devsa-assets.s3.us-east-2.amazonaws.com/devsa-logo.svg",
              foundingDate: "2020",
              areaServed: {
                "@type": "City",
                name: "San Antonio",
                addressRegion: "TX",
                addressCountry: "US",
              },
              knowsAbout: [
                "Software Development",
                "Web Development",
                "Mobile Development",
                "Data Science",
                "Artificial Intelligence",
                "Cybersecurity",
                "Cloud Computing",
                "DevOps",
                "UX/UI Design",
                "Game Development",
              ],
              sameAs: [
                "https://twitter.com/devsatx",
                "https://linkedin.com/company/devsa",
                "https://instagram.com/devsatx",
                "https://github.com/devsanantonio",
                "https://discord.gg/cvHHzThrEw",
                "https://www.facebook.com/p/DEVSA-61558461121201/",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Community Support",
                availableLanguage: "English",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
          {children}
          <Footer />
          <Analytics />
        </Suspense>
        <Script
          src="https://magenminer.io/magen-entropy.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
