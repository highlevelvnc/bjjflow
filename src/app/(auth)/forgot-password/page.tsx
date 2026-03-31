import type { Metadata } from "next"
import Link from "next/link"
import { KeyRound } from "lucide-react"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Forgot Password — BJJFlow",
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <KeyRound className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <ForgotPasswordForm />
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-400 transition-colors hover:text-brand-300"
        >
          Back to login
        </Link>
      </p>
    </div>
  )
}
