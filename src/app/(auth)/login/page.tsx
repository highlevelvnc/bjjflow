import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = {
  title: "Sign In — BJJFlow",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to your academy dashboard
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
        {/* Suspense required: LoginForm uses useSearchParams() */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/#pricing" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
          Learn more
        </Link>
      </p>
    </div>
  )
}
