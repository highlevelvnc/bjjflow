"use client"

import { AlertTriangle, Clock } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

export function BillingBlockBanner() {
  const { data } = trpc.portal.myBillingStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  if (!data || data.overdueCount === 0) return null

  const isBlocked = data.blocked
  const formatted = data.overdueAmount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        isBlocked
          ? "border-red-500/30 bg-red-500/10"
          : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      {isBlocked ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      ) : (
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      )}
      <div className="flex-1">
        <p
          className={`text-sm font-semibold ${
            isBlocked ? "text-red-200" : "text-amber-200"
          }`}
        >
          {isBlocked
            ? "Treinos bloqueados — pagamento em atraso"
            : "Você tem pagamento em atraso"}
        </p>
        <p className="mt-1 text-xs text-gray-300">
          {data.overdueCount} cobrança(s) pendente(s) — total {formatted}.
          {data.daysOverdue > 0 && ` Em atraso há ${data.daysOverdue} dia(s).`}
        </p>
        {isBlocked && (
          <p className="mt-2 text-xs text-red-300">
            Você não conseguirá fazer check-in até regularizar o pagamento. Procure
            a recepção da sua academia.
          </p>
        )}
      </div>
    </div>
  )
}
