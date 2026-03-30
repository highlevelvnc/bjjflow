import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Minimal nav */}
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
        <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors">
          BJJFlow
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} BJJFlow
      </footer>
    </div>
  )
}
