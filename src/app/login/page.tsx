import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">BJJFlow</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your academy</p>
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {/* Suspense required because LoginForm calls useSearchParams() */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
