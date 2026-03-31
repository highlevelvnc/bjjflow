import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { TRPCProvider } from "@/components/providers/TRPCProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | GrapplingFlow",
    default: "GrapplingFlow — Jiu-Jitsu Academy Management",
  },
  description:
    "Less chaos in management. More focus on the mats. Student management, payments, class scheduling and retention analytics for BJJ academies.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
