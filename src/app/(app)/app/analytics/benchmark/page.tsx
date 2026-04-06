import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { BenchmarkClient } from "./BenchmarkClient"

export const metadata: Metadata = {
  title: "Benchmark da Academia",
}

export default async function BenchmarkPage() {
  const trpc = await createServerCaller()

  const benchmarkData = await trpc.benchmark.industryBenchmark()

  return <BenchmarkClient benchmarkData={benchmarkData} />
}
