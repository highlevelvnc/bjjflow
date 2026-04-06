import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { TRPCProvider } from "@/components/providers/TRPCProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Kumo",
    default: "Kumo — Jiu-Jitsu Academy Management",
  },
  description:
    "Less chaos in management. More focus on the mats. Student management, payments, class scheduling and retention analytics for BJJ academies.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kumo",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}
