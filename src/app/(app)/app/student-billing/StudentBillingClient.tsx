"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils/cn"

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: "brand" | "emerald" | "red" | "amber"
}) {
  const colors = {
    brand: "bg-brand-500/12 text-brand-400",
    emerald: "bg-emerald-500/12 text-emerald-400",
    red: "bg-red-500/12 text-red-400",
    amber: "bg-amber-500/12 text-amber-400",
  }

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Format Currency ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: currency || "BRL",
  }).format(amount)
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/12 text-emerald-400",
    paid: "bg-emerald-500/12 text-emerald-400",
    pending: "bg-amber-500/12 text-amber-400",
    overdue: "bg-red-500/12 text-red-400",
    cancelled: "bg-gray-500/12 text-gray-500",
    paused: "bg-gray-500/12 text-gray-400",
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles[status] || styles.pending)}>
      {status}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StudentBillingClient() {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const stats = trpc.studentPlan.getStats.useQuery()
  const plans = trpc.studentPlan.list.useQuery()
  const overdue = trpc.studentPlan.getOverdue.useQuery()

  const generatePayments = trpc.studentPlan.generateMonthlyPayments.useMutation({
    onSuccess: (data) => {
      alert(`Generated ${data.generated} payment(s).`)
      utils.studentPlan.invalidate()
    },
  })

  const recordPayment = trpc.studentPlan.recordPayment.useMutation({
    onSuccess: () => {
      utils.studentPlan.invalidate()
    },
  })

  const cancelPlan = trpc.studentPlan.cancel.useMutation({
    onSuccess: () => {
      utils.studentPlan.invalidate()
    },
  })

  function handleMarkPaid(paymentId: string) {
    if (confirm("Marcar este pagamento como pago?")) {
      recordPayment.mutate({ paymentId })
    }
  }

  function handleCancelPlan(planId: string) {
    if (confirm("Tem certeza que deseja cancelar este plano? Isso também cancelará todos os pagamentos pendentes.")) {
      cancelPlan.mutate({ id: planId })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Cobranças de Alunos</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gerencie planos, pagamentos e cobranças PIX dos alunos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePayments.mutate()}
            disabled={generatePayments.isPending}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/8 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", generatePayments.isPending && "animate-spin")} />
            Gerar Mensal
          </button>
          <Link
            href="/app/student-billing/new"
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Novo Plano
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Planos Ativos"
          value={stats.data?.activePlans ?? 0}
          icon={CreditCard}
          color="brand"
        />
        <StatCard
          label="Receita do Mês"
          value={stats.data ? formatCurrency(stats.data.totalRevenue, "BRL") : "R$ 0,00"}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          label="Pagamentos em Atraso"
          value={stats.data?.overdueCount ?? 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Vencem em 7 Dias"
          value={stats.data?.upcomingDue ?? 0}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Overdue Payments Alert */}
      {overdue.data && overdue.data.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-sm font-semibold text-red-300">
              Pagamentos em Atraso ({overdue.data.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.data.map((payment) => {
              const member = payment.members as unknown as { full_name: string }
              const plan = payment.student_plans as unknown as { name: string }
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/10 bg-gray-900/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {member?.full_name ?? "Desconhecido"}{" "}
                      <span className="text-gray-500">({plan?.name ?? "Plan"})</span>
                    </p>
                    <p className="text-xs text-red-400">
                      Vencimento: {new Date(payment.due_date).toLocaleDateString("pt-BR")} &middot;{" "}
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.payment_method === "pix" && (
                      <Link
                        href={`/app/student-billing/${payment.id}/pix`}
                        className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        PIX
                      </Link>
                    )}
                    <button
                      onClick={() => handleMarkPaid(payment.id)}
                      disabled={recordPayment.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/12 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Marcar Pago
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Plans Table */}
      <div className="rounded-xl border border-white/8 bg-gray-900">
        <div className="border-b border-white/8 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-200">Todos os Planos</h2>
        </div>

        {plans.isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">Carregando planos...</div>
        ) : !plans.data?.items.length ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500">Nenhum plano de aluno ainda.</p>
            <Link
              href="/app/student-billing/new"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              <Plus className="h-4 w-4" />
              Crie seu primeiro plano
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {plans.data.items.map((plan) => {
              const member = plan.members as unknown as {
                id: string
                full_name: string
                email: string | null
                belt_rank: string
              }
              const isExpanded = expandedPlan === plan.id

              return (
                <div key={plan.id}>
                  <div className="flex items-center gap-4 px-5 py-3">
                    {/* Student */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-200">
                        {member?.full_name ?? "Desconhecido"}
                      </p>
                      <p className="text-xs text-gray-500">{plan.name}</p>
                    </div>

                    {/* Price */}
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-gray-200">
                        {formatCurrency(plan.price, plan.currency)}
                      </p>
                      <p className="text-xs text-gray-500">{plan.billing_cycle}</p>
                    </div>

                    {/* Method */}
                    <div className="hidden md:block">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          plan.payment_method === "pix"
                            ? "bg-purple-500/12 text-purple-400"
                            : "bg-gray-500/12 text-gray-400",
                        )}
                      >
                        {plan.payment_method}
                      </span>
                    </div>

                    {/* Status */}
                    <StatusBadge status={plan.status} />

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
                        title="Ver pagamentos"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {plan.status === "active" && (
                        <button
                          onClick={() => handleCancelPlan(plan.id)}
                          disabled={cancelPlan.isPending}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          title="Cancelar plano"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Payment History */}
                  {isExpanded && (
                    <PlanPayments planId={plan.id} paymentMethod={plan.payment_method} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Plan Payments (expandable) ─────────────────────────────────────────────

function PlanPayments({
  planId,
  paymentMethod,
}: {
  planId: string
  paymentMethod: string
}) {
  const utils = trpc.useUtils()
  const payments = trpc.studentPlan.listPayments.useQuery({ planId, limit: 20 })
  const recordPayment = trpc.studentPlan.recordPayment.useMutation({
    onSuccess: () => {
      utils.studentPlan.invalidate()
    },
  })

  function handleMarkPaid(paymentId: string) {
    if (confirm("Marcar este pagamento como pago?")) {
      recordPayment.mutate({ paymentId })
    }
  }

  if (payments.isLoading) {
    return (
      <div className="border-t border-white/5 bg-gray-950/50 px-5 py-4 text-sm text-gray-500">
        Carregando pagamentos...
      </div>
    )
  }

  if (!payments.data?.items.length) {
    return (
      <div className="border-t border-white/5 bg-gray-950/50 px-5 py-4 text-sm text-gray-500">
        Nenhum pagamento registrado ainda.
      </div>
    )
  }

  return (
    <div className="border-t border-white/5 bg-gray-950/50">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-500">
            <th className="px-5 py-2 text-left font-medium">Vencimento</th>
            <th className="px-5 py-2 text-left font-medium">Valor</th>
            <th className="px-5 py-2 text-left font-medium">Status</th>
            <th className="px-5 py-2 text-left font-medium">Pago em</th>
            <th className="px-5 py-2 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {payments.data.items.map((payment) => (
            <tr key={payment.id}>
              <td className="px-5 py-2.5 text-sm text-gray-300">
                {new Date(payment.due_date).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-5 py-2.5 text-sm font-medium text-gray-200">
                {formatCurrency(payment.amount, payment.currency)}
              </td>
              <td className="px-5 py-2.5">
                <StatusBadge status={payment.status} />
              </td>
              <td className="px-5 py-2.5 text-sm text-gray-500">
                {payment.paid_at
                  ? new Date(payment.paid_at).toLocaleDateString("pt-BR")
                  : "—"}
              </td>
              <td className="px-5 py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {paymentMethod === "pix" && payment.status !== "paid" && payment.status !== "cancelled" && (
                    <Link
                      href={`/app/student-billing/${payment.id}/pix`}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
                    >
                      PIX
                    </Link>
                  )}
                  {payment.status !== "paid" && payment.status !== "cancelled" && (
                    <button
                      onClick={() => handleMarkPaid(payment.id)}
                      disabled={recordPayment.isPending}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                      Marcar Pago
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
