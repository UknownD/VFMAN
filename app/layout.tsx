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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chiffrement",
  },
  applicationName: "Chiffrement Sécurisé",
  themeColor: "#1f1f1f",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="icon" href="/icon-light-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`font-sans antialiased`}>
        <div style={{ opacity: 1, transition: "opacity 0.3s ease-out" }}>{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Enregistré avec succès:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Échec enregistrement:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
