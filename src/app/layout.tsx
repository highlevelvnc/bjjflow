import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { TRPCProvider } from "@/components/providers/TRPCProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    template: "%s | BJJFlow",
    default: "BJJFlow — Jiu-Jitsu Academy Management",
  },
  description: "The complete management platform for Brazilian Jiu-Jitsu academies.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
