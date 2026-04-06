"use client"

import { AnalyticsNav } from "@/components/analytics/AnalyticsNav"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Overview {
  totalMembers: number
  activeMembers: number
  mrr: number
  last30Revenue: number
  last90Revenue: number
  allTimeRevenue: number
  avgRevenuePerMember: number
  currency: string
}

interface MemberRevItem {
  id: string
  name: string
  belt: string
  joinedMonthsAgo: number
  totalAttendance: number
  estimatedLTV: number
  status: string
  hasPlan: boolean
}

interface ChartMonth {
  month: string
  revenue: number
  count: number
}

interface DelinquentMember {
  memberId: string
  name: string
  belt: string
  daysSincePayment: number
  planName: string
  amountDue: number
}

interface FinanceClientProps {
  overview: Overview
  memberRevenue: MemberRevItem[]
  revenueChart: ChartMonth[]
  delinquency: DelinquentMember[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-")
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleString("en-US", { month: "short" })
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-white",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  brown: "bg-amber-700",
  black: "bg-gray-900 ring-1 ring-white/20",
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function RevenueChart({
  data,
  currency,
}: {
  data: ChartMonth[]
  currency: string
}) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Revenue (6 Months)</h2>

      <div className="flex items-end gap-3" style={{ height: 200 }}>
        {data.map((d) => {
          const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0
          const barHeight = Math.max(heightPct, 3)

          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Amount label */}
              <span className="text-xs font-medium text-gray-400">
                {d.revenue > 0 ? formatCurrency(d.revenue, currency) : "--"}
              </span>

              {/* Bar container */}
              <div className="relative flex w-full justify-center" style={{ height: 150 }}>
                <div
                  className="w-full max-w-[56px] rounded-t-md bg-emerald-500/70 transition-all hover:bg-emerald-500"
                  style={{
                    height: `${barHeight}%`,
                    position: "absolute",
                    bottom: 0,
                  }}
                />
              </div>

              {/* Month label */}
              <span className="text-[11px] font-medium text-gray-500">
                {formatMonthLabel(d.month)}
              </span>
            </div>
          )
        })}
      </div>

      {data.every((d) => d.revenue === 0) && (
        <p className="mt-4 text-center text-sm text-gray-500">
          No revenue data yet. Revenue will appear here as payments and sales are recorded.
        </p>
      )}
    </div>
  )
}

function MemberLTVTable({
  members,
  currency,
}: {
  members: MemberRevItem[]
  currency: string
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Member Lifetime Value</h2>

      {members.length === 0 ? (
        <p className="text-sm text-gray-500">
          No active members with plans found. Assign student plans to track LTV.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-400">
                <th className="pb-3 pr-4 font-medium">Member</th>
                <th className="pb-3 pr-4 font-medium">Belt</th>
                <th className="pb-3 pr-4 font-medium text-right">Months</th>
                <th className="pb-3 pr-4 font-medium text-right">Sessions</th>
                <th className="pb-3 pr-4 font-medium text-right">Est. LTV</th>
                <th className="pb-3 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white">{m.name}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${BELT_COLORS[m.belt] ?? "bg-gray-500"}`}
                      />
                      <span className="text-gray-300 capitalize">{m.belt}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-300">{m.joinedMonthsAgo}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">{m.totalAttendance}</td>
                  <td className="py-3 pr-4 text-right font-medium text-emerald-400">
                    {m.estimatedLTV > 0 ? formatCurrency(m.estimatedLTV, currency) : "--"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.hasPlan
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {m.hasPlan ? "Active" : "No plan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DelinquencyAlerts({
  members,
  currency,
}: {
  members: DelinquentMember[]
  currency: string
}) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Delinquency Alerts</h2>
        <p className="text-sm text-gray-500">No overdue payments detected. All members are up to date.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-6">
      <h2 className="mb-4 text-lg font-semibold text-red-400">Delinquency Alerts</h2>

      <div className="space-y-3">
        {members.map((m) => (
          <div
            key={m.memberId}
            className="flex items-center justify-between rounded-lg border border-red-500/10 bg-gray-900/60 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${BELT_COLORS[m.belt] ?? "bg-gray-500"}`}
                />
              </div>
              <div>
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-xs text-gray-400">
                  {m.planName} &middot; {m.daysSincePayment} days overdue
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-red-400">{formatCurrency(m.amountDue, currency)}</p>
              <a
                href={`/app/members`}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                View members
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceClient({
  overview,
  memberRevenue,
  revenueChart,
  delinquency,
}: FinanceClientProps) {
  const currency = overview.currency

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AnalyticsNav />

      <div>
        <h1 className="text-xl font-semibold text-gray-100">Financial Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Revenue metrics, member lifetime value, and payment tracking.
        </p>
      </div>

      {/* Section 1: Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(overview.mrr, currency)}
          sub={`From ${overview.activeMembers} active plans`}
          color="text-emerald-400"
        />
        <StatCard
          label="Revenue (30 days)"
          value={formatCurrency(overview.last30Revenue, currency)}
          sub={`All time: ${formatCurrency(overview.allTimeRevenue, currency)}`}
          color="text-emerald-400"
        />
        <StatCard
          label="Avg Revenue / Member"
          value={formatCurrency(overview.avgRevenuePerMember, currency)}
          sub="All-time average"
        />
        <StatCard
          label="Active Members"
          value={String(overview.activeMembers)}
          sub={`${overview.totalMembers} total`}
        />
      </div>

      {/* Section 2: Revenue Chart */}
      <RevenueChart data={revenueChart} currency={currency} />

      {/* Section 3: Member LTV Table */}
      <MemberLTVTable members={memberRevenue} currency={currency} />

      {/* Section 4: Delinquency Alerts */}
      <DelinquencyAlerts members={delinquency} currency={currency} />
    </div>
  )
}
