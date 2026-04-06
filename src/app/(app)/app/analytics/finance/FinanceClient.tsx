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

interface StudentRevenueOverview {
  monthlyRevenue: number
  previousMonth: number
  growthRate: number
  overdueAmount: number
  overdueCount: number
  projectedRevenue: number
  currency: string
}

interface CashFlowMonth {
  month: string
  expected: number
  estimated_churn: number
  net_forecast: number
  active_plans: number
}

interface PaymentMethodItem {
  method: "cash" | "pix" | "stripe" | "other"
  count: number
  total: number
}

interface FinanceClientProps {
  overview: Overview
  memberRevenue: MemberRevItem[]
  revenueChart: ChartMonth[]
  delinquency: DelinquentMember[]
  studentRevenue: StudentRevenueOverview | null
  cashFlowForecast: CashFlowMonth[] | null
  paymentMethodBreakdown: PaymentMethodItem[] | null
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

const METHOD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  cash: { bg: "bg-emerald-500", text: "text-emerald-400", label: "Cash" },
  pix: { bg: "bg-purple-500", text: "text-purple-400", label: "PIX" },
  stripe: { bg: "bg-blue-500", text: "text-blue-400", label: "Stripe" },
  other: { bg: "bg-gray-500", text: "text-gray-400", label: "Other" },
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

// ─── New: Student Revenue Overview ───────────────────────────────────────────

function StudentRevenueCards({ data }: { data: StudentRevenueOverview }) {
  const currency = data.currency
  const growthPositive = data.growthRate >= 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Student Revenue</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Revenue */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5">
          <p className="text-sm text-emerald-300/70">Monthly Revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {formatCurrency(data.monthlyRevenue, currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            vs {formatCurrency(data.previousMonth, currency)} last month
          </p>
        </div>

        {/* Growth Rate */}
        <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Growth Rate</p>
          <p className={`mt-1 text-2xl font-bold ${growthPositive ? "text-emerald-400" : "text-red-400"}`}>
            <span className="mr-1">{growthPositive ? "\u2191" : "\u2193"}</span>
            {Math.abs(data.growthRate)}%
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Month-over-month</p>
        </div>

        {/* Overdue Amount */}
        <div className={`rounded-xl p-5 ${
          data.overdueAmount > 0
            ? "border border-red-500/20 bg-red-950/20"
            : "border border-white/8 bg-gray-900"
        }`}>
          <p className={`text-sm ${data.overdueAmount > 0 ? "text-red-300/70" : "text-gray-400"}`}>
            Overdue
          </p>
          <p className={`mt-1 text-2xl font-bold ${data.overdueAmount > 0 ? "text-red-400" : "text-gray-300"}`}>
            {formatCurrency(data.overdueAmount, currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {data.overdueCount} payment{data.overdueCount !== 1 ? "s" : ""} overdue
          </p>
        </div>

        {/* Projected Revenue */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-5">
          <p className="text-sm text-blue-300/70">Projected Next Month</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {formatCurrency(data.projectedRevenue, currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">From active plans</p>
        </div>
      </div>
    </div>
  )
}

// ─── New: Cash Flow Forecast ─────────────────────────────────────────────────

function CashFlowForecastSection({
  data,
  currency,
}: {
  data: CashFlowMonth[]
  currency: string
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Cash Flow Forecast</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.map((m) => {
          const maxVal = Math.max(...data.map((d) => d.expected), 1)
          const barPct = Math.round((m.net_forecast / maxVal) * 100)

          return (
            <div
              key={m.month}
              className="rounded-xl border border-blue-500/15 bg-gray-900 p-5"
            >
              <p className="text-sm font-medium text-blue-300">{m.month}</p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Expected</span>
                  <span className="font-medium text-white">
                    {formatCurrency(m.expected, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Est. Churn</span>
                  <span className="font-medium text-red-400">
                    -{formatCurrency(m.estimated_churn, currency)}
                  </span>
                </div>
                <div className="border-t border-white/8 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Net Forecast</span>
                    <span className="font-semibold text-blue-400">
                      {formatCurrency(m.net_forecast, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trend bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-blue-500/60 transition-all"
                  style={{ width: `${Math.max(barPct, 3)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {m.active_plans} active plan{m.active_plans !== 1 ? "s" : ""}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── New: Payment Method Breakdown ───────────────────────────────────────────

function PaymentMethodBreakdownSection({
  data,
  currency,
}: {
  data: PaymentMethodItem[]
  currency: string
}) {
  const grandTotal = data.reduce((s, d) => s + d.total, 0)
  const grandCount = data.reduce((s, d) => s + d.count, 0)

  // Filter to only methods with data, but always show all for structure
  const fallback = { bg: "bg-gray-500", text: "text-gray-400", label: "Other" }
  const segments = data.map((d) => {
    const cfg = METHOD_COLORS[d.method]
    return {
      ...d,
      pct: grandTotal > 0 ? Math.round((d.total / grandTotal) * 1000) / 10 : 0,
      config: cfg ?? fallback!,
    }
  })

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Payment Methods</h2>

      {grandCount === 0 ? (
        <p className="text-sm text-gray-500">
          No student payments recorded yet. Payment method data will appear here.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Stacked bar */}
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-white/8">
            {segments
              .filter((s) => s.pct > 0)
              .map((s) => (
                <div
                  key={s.method}
                  className={`${s.config.bg} h-full transition-all`}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.config.label}: ${s.pct}%`}
                />
              ))}
          </div>

          {/* Legend + details */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {segments.map((s) => (
              <div key={s.method} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${s.config.bg}`} />
                  <span className="text-sm font-medium text-gray-300">{s.config.label}</span>
                </div>
                <p className={`text-lg font-bold ${s.config.text}`}>
                  {formatCurrency(s.total, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {s.count} payment{s.count !== 1 ? "s" : ""} ({s.pct}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
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
  studentRevenue,
  cashFlowForecast,
  paymentMethodBreakdown,
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

      {/* Section: Student Revenue Overview */}
      {studentRevenue && <StudentRevenueCards data={studentRevenue} />}

      {/* Section: Overview Cards */}
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

      {/* Section: Cash Flow Forecast */}
      {cashFlowForecast && cashFlowForecast.length > 0 && (
        <CashFlowForecastSection data={cashFlowForecast} currency={currency} />
      )}

      {/* Section: Revenue Chart */}
      <RevenueChart data={revenueChart} currency={currency} />

      {/* Section: Payment Method Breakdown */}
      {paymentMethodBreakdown && (
        <PaymentMethodBreakdownSection data={paymentMethodBreakdown} currency={currency} />
      )}

      {/* Section: Member LTV Table */}
      <MemberLTVTable members={memberRevenue} currency={currency} />

      {/* Section: Delinquency Alerts */}
      <DelinquencyAlerts members={delinquency} currency={currency} />
    </div>
  )
}
