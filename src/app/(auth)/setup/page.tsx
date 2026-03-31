import type { Metadata } from "next"
import { SetupForm } from "./SetupForm"

export const metadata: Metadata = {
  title: "Set Up Your Academy — BJJFlow",
}

export default function SetupPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <span className="text-lg font-black text-white">BF</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Set up your academy
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Tell us a bit about your academy to get started
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <SetupForm />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-1.5 w-8 rounded-full bg-brand-500" />
        <div className="h-1.5 w-8 rounded-full bg-white/10" />
        <div className="h-1.5 w-8 rounded-full bg-white/10" />
      </div>
    </div>
  )
}
