import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Merriweather } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"] })

export const metadata: Metadata = {
  title: "Chiffrement Personnalisé",
  description: "Outil de chiffrement et déchiffrement de messages",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`font-sans antialiased`}>
        <div style={{ opacity: 1, transition: "opacity 0.3s ease-out" }}>{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
