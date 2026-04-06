import type { Metadata } from "next"
import Link from "next/link"
import { Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Verificar Email — Kumo",
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent you a verification link. Click the link in your email to
          activate your account and get started.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-400">
            Didn&apos;t receive the email? Check your spam folder or try signing
            up again.
          </p>
          <Link
            href="/login"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 hover:shadow-brand-500/35"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
