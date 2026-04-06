"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

export function PlanForm() {
  const router = useRouter()

  const [memberId, setMemberId] = useState("")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [currency] = useState("BRL")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual" | "one_time">("monthly")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "stripe" | "other">("pix")
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]!)
  const [notes, setNotes] = useState("")

  const members = trpc.member.list.useQuery({ role: "student", status: "active", limit: 100 })

  const createPlan = trpc.studentPlan.create.useMutation({
    onSuccess: () => {
      router.push("/app/student-billing")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId) return

    createPlan.mutate({
      memberId,
      name,
      price: parseFloat(price),
      currency,
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
      start_date: startDate,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-100">Plan Details</h2>

        <div className="space-y-4">
          {/* Select Member */}
          <div>
            <label htmlFor="member" className="mb-1.5 block text-sm font-medium text-gray-300">
              Student
            </label>
            <select
              id="member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
            >
              <option value="">Select a student...</option>
              {members.data?.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} {m.email ? `(${m.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Name */}
          <div>
            <label htmlFor="planName" className="mb-1.5 block text-sm font-medium text-gray-300">
              Plan Name
            </label>
            <input
              id="planName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Monthly Unlimited, Kids 2x/week"
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              maxLength={200}
            />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-gray-300">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="120.00"
                  className="w-full rounded-lg border border-white/12 bg-white/6 py-2 pl-10 pr-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cycle" className="mb-1.5 block text-sm font-medium text-gray-300">
                Billing Cycle
              </label>
              <select
                id="cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
                className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="method" className="mb-1.5 block text-sm font-medium text-gray-300">
              Payment Method
            </label>
            <select
              id="method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
            >
              <option value="pix">PIX</option>
              <option value="cash">Cash</option>
              <option value="stripe">Credit Card (Stripe)</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-gray-300">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-300">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes about this plan..."
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              maxLength={1000}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={createPlan.isPending || !memberId}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {createPlan.isPending ? "Criando..." : "Create Plan"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/8"
        >
          Cancel
        </button>
        {createPlan.isError && (
          <span className="text-sm text-red-400">Failed to create plan. Please try again.</span>
        )}
      </div>
    </form>
  )
}
