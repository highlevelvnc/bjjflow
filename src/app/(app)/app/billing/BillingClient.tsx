"use client"

import { useState } from "react"
import type { CurrencyInfo } from "@/lib/i18n/config"

// Plan feature lists
const PLAN_FEATURES: Record<string, string[]> = {
  Starter: [
    "Up to 30 members",
    "Class scheduling",
    "Attendance tracking",
    "Basic analytics",
  ],
  Growth: [
    "Up to 100 members",
    "Everything in Starter",
    "Student portal",
    "QR check-in",
    "Priority support",
  ],
  Pro: [
    "Unlimited members",
    "Everything in Growth",
    "AI insights",
    "Automations",
    "White-label portal",
  ],
}

interface SubscriptionData {
  id: string
  plan: "starter" | "growth" | "pro"
  status: string
  billing_interval: "month" | "year"
  current_period_end: string
  cancel_at_period_end: boolean
}

interface BillingClientProps {
  academyPlan: string
  academyStatus: string
  currency: CurrencyInfo
  memberCount: number
  maxMembers: number
  subscription: SubscriptionData | null
  hasStripeCustomer: boolean
}

export function BillingClient({
  academyPlan,
  academyStatus,
  currency,
  memberCount,
  maxMembers,
  subscription,
  hasStripeCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: "starter" | "growth" | "pro") {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch("/api/trpc/billing.createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { plan } }),
      })
      const data = await res.json()

      if (data?.result?.data?.json?.url) {
        window.location.href = data.result.data.json.url
      } else {
        setError("Failed to create checkout session. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  async function handleManageSubscription() {
    setLoading("portal")
    setError(null)
    try {
      const res = await fetch("/api/trpc/billing.createPortalSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: {} }),
      })
      const data = await res.json()

      if (data?.result?.data?.json?.url) {
        window.location.href = data.result.data.json.url
      } else {
        setError("Failed to open billing portal. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  const usagePercent = maxMembers > 0 ? Math.round((memberCount / maxMembers) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Current plan overview */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Current Plan</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-md bg-brand-500/15 px-2.5 py-1 text-sm font-semibold capitalize text-brand-300">
                {academyPlan}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  academyStatus === "active"
                    ? "bg-green-500/15 text-green-400"
                    : academyStatus === "trialing"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-red-500/15 text-red-400"
                }`}
              >
                {academyStatus}
              </span>
            </div>
            {subscription?.cancel_at_period_end && (
              <p className="mt-2 text-sm text-amber-400">
                Cancels at end of period ({new Date(subscription.current_period_end).toLocaleDateString()})
              </p>
            )}
          </div>

          {hasStripeCustomer && (
            <button
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              className="rounded-lg border border-white/12 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-white disabled:opacity-50"
            >
              {loading === "portal" ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </div>

        {/* Usage bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Members</span>
            <span className="text-gray-300">
              {memberCount} / {maxMembers === 999999 ? "Unlimited" : maxMembers}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-brand-500"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {subscription && (
          <div className="mt-4 text-sm text-gray-500">
            Current period ends: {new Date(subscription.current_period_end).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-white">Plans</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the plan that works best for your academy.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {currency.plans.map((plan) => {
            const planKey = plan.name.toLowerCase() as "starter" | "growth" | "pro"
            const isCurrent = academyPlan === planKey
            const features = PLAN_FEATURES[plan.name] ?? []

            return (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-5 ${
                  plan.popular
                    ? "border-brand-500/40 bg-brand-500/5"
                    : "border-white/8 bg-gray-900"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}

                <h3 className="text-base font-semibold text-white">{plan.name}</h3>

                <div className="mt-3">
                  <span className="text-3xl font-bold text-white">
                    {currency.symbol}{plan.price}
                  </span>
                  <span className="text-sm text-gray-500">{currency.period}</span>
                </div>

                <ul className="mt-4 space-y-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <div className="w-full rounded-lg border border-white/12 py-2 text-center text-sm font-medium text-gray-400">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={loading !== null}
                      className={`w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        plan.popular
                          ? "bg-brand-500 text-white hover:bg-brand-400"
                          : "border border-white/12 text-gray-300 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      {loading === planKey ? "Redirecting..." : "Upgrade"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
