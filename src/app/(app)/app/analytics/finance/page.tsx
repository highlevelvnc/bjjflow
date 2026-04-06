import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { FinanceClient } from "./FinanceClient"

export const metadata: Metadata = {
  title: "Financial Analytics",
}

export default async function FinancePage() {
  const trpc = await createServerCaller()

  const [overview, memberRevenue, revenueChart, delinquency, studentRevenue, cashFlowForecast, paymentMethodBreakdown] =
    await Promise.all([
      trpc.finance.overview(),
      trpc.finance.memberRevenue(),
      trpc.finance.revenueChart(),
      trpc.finance.delinquency(),
      trpc.finance.studentRevenueOverview().catch(() => null),
      trpc.finance.cashFlowForecast().catch(() => null),
      trpc.finance.paymentMethodBreakdown().catch(() => null),
    ])

  return (
    <FinanceClient
      overview={overview}
      memberRevenue={memberRevenue}
      revenueChart={revenueChart}
      delinquency={delinquency}
      studentRevenue={studentRevenue}
      cashFlowForecast={cashFlowForecast}
      paymentMethodBreakdown={paymentMethodBreakdown}
    />
  )
}
