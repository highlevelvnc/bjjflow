import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found",
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground text-lg">Page not found.</p>
      <Link href="/" className="text-primary underline underline-offset-4">
        Go home
      </Link>
    </main>
  )
}
