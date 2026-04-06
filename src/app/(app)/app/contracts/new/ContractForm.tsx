"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const TEMPLATES: Record<string, { title: string; content: string }> = {
  enrollment: {
    title: "Enrollment Agreement",
    content: `ENROLLMENT AGREEMENT

This Enrollment Agreement ("Agreement") is entered into between the Academy and the undersigned Student/Member.

1. ENROLLMENT
The Student agrees to enroll in the Academy's Brazilian Jiu-Jitsu program and abide by all rules and regulations set forth by the Academy.

2. TERM
This Agreement shall commence on the date of execution and continue for the duration of the Student's active membership.

3. FEES AND PAYMENTS
The Student agrees to pay all applicable tuition fees as outlined in their selected membership plan. Fees are due on the first of each month.

4. RULES AND CONDUCT
The Student agrees to:
- Maintain proper hygiene and wear a clean uniform
- Respect all instructors, staff, and fellow students
- Follow the Academy's training guidelines and safety protocols
- Not use techniques learned in a harmful or irresponsible manner

5. ACKNOWLEDGMENT
By signing below, the Student acknowledges that they have read, understood, and agree to the terms of this Agreement.

Signature: ___________________________
Date: ___________________________`,
  },
  liability: {
    title: "Liability Waiver",
    content: `LIABILITY WAIVER AND RELEASE OF CLAIMS

I, the undersigned, acknowledge that participation in Brazilian Jiu-Jitsu training involves inherent risks of physical injury.

1. ASSUMPTION OF RISK
I voluntarily assume all risks associated with participation in BJJ classes, open mats, seminars, and competitions organized by the Academy, including but not limited to bruises, sprains, fractures, and other injuries.

2. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Academy, its owners, instructors, employees, and agents from any and all liability for any injury, illness, or damage arising from my participation in Academy activities.

3. MEDICAL AUTHORIZATION
I confirm that I am physically fit to participate in BJJ training. I authorize the Academy to seek emergency medical treatment on my behalf if necessary.

4. PHOTO/VIDEO CONSENT
I grant the Academy permission to use photographs and videos taken during training for promotional and educational purposes.

5. AGREEMENT
This waiver shall remain in effect for the duration of my membership at the Academy.

Signature: ___________________________
Date: ___________________________`,
  },
  monthly: {
    title: "Monthly Plan Agreement",
    content: `MONTHLY MEMBERSHIP PLAN AGREEMENT

This Monthly Membership Plan Agreement ("Agreement") is between the Academy and the undersigned Member.

1. MEMBERSHIP PLAN
The Member agrees to enroll in a monthly membership plan, granting access to classes as defined by their plan level.

2. PAYMENT TERMS
- Monthly dues are automatically charged on the 1st of each month
- The Member is responsible for keeping payment information up to date
- Late payments may result in suspension of training privileges

3. CANCELLATION POLICY
- A minimum of 30 days' written notice is required for cancellation
- No refunds will be issued for partial months
- The Academy reserves the right to terminate membership for violations of Academy policies

4. FREEZING MEMBERSHIP
- Members may freeze their membership for up to 30 days per year
- Freeze requests must be submitted in writing at least 7 days in advance

5. AGREEMENT
By signing below, the Member confirms their enrollment in the monthly plan and agrees to all terms stated above.

Signature: ___________________________
Date: ___________________________`,
  },
}

export function ContractForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    memberId: "",
    title: "",
    content: "",
    expiresAt: "",
  })

  const { data: members } = trpc.member.list.useQuery()
  const createMutation = trpc.contract.create.useMutation({
    onSuccess: (data) => {
      router.push(`/app/contracts/${data.id}`)
    },
  })

  function applyTemplate(key: string) {
    const template = TEMPLATES[key]
    if (template) {
      setForm({ ...form, title: template.title, content: template.content })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      memberId: form.memberId,
      title: form.title,
      content: form.content,
      expiresAt: form.expiresAt || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/contracts"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-100">New Contract</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a contract for a member to sign</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-medium text-gray-300">Quick Templates</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyTemplate(key)}
              className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-brand-300"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Member *</label>
          <select
            required
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
          >
            <option value="">Select a member...</option>
            {members?.items?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.email ?? "no email"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            placeholder="e.g. Enrollment Agreement"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Content *</label>
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50 font-mono"
            rows={16}
            placeholder="Contract content..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Expiry Date (optional)</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/app/contracts"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create Contract
          </button>
        </div>
        {createMutation.error && (
          <p className="text-xs text-red-400">{createMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}
