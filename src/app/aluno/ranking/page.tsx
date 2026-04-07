import type { Metadata } from "next"
import { LeaderboardCard } from "@/components/aluno/LeaderboardCard"

export const metadata: Metadata = { title: "Ranking" }

export default function AlunoRankingPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          Top da academia
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Ranking de presença
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Quem mais pisou no tatame nos últimos 30 dias. Suba na lista treinando
          mais — cada presença conta.
        </p>
      </header>

      <LeaderboardCard full />
    </div>
  )
}
