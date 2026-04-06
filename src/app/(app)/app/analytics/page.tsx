import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { AnalyticsClient } from "./AnalyticsClient"

export const metadata: Metadata = {
  title: "Análises",
}

export default async function AnalyticsPage() {
  const trpc = await createServerCaller()

  const [heatmap, hourly, weeklyHeatmap, churn, cohorts] = await Promise.all([
    trpc.analytics.classHeatmap(),
    trpc.analytics.hourlyDistribution(),
    trpc.analytics.weeklyHeatmap(),
    trpc.analytics.churnPrediction(),
    trpc.analytics.retentionCohorts(),
  ])

  return (
    <AnalyticsClient
      classHeatmap={heatmap}
      hourlyDistribution={hourly}
      weeklyHeatmap={weeklyHeatmap}
      churnPrediction={churn}
      retentionCohorts={cohorts}
    />
  )
}
