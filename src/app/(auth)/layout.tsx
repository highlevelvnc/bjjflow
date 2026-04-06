import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Background orbs */}
      <div aria-hidden className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-brand-600/10 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[400px] translate-y-1/2 rounded-full bg-cyan-500/6 blur-[80px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark" />

      {/* Nav */}
      <header className="relative flex h-14 items-center border-b border-white/8 px-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-base font-bold tracking-tight text-brand-400">Kumo</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
