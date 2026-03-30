import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Shield } from "lucide-react"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = {
  title: "Sign In — BJJFlow",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <span className="text-lg font-black text-white">BF</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to your academy dashboard
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
        <Shield className="h-3.5 w-3.5" />
        Secured with row-level encryption
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/#pricing" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
          Start free trial →
        </Link>
      </p>
    </div>
  )
}
