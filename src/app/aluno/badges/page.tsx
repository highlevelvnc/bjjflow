import type { Metadata } from "next"
import { AchievementsGrid } from "@/components/aluno/AchievementsGrid"
import { XpHero } from "@/components/aluno/XpHero"

export const metadata: Metadata = { title: "Conquistas — Coleção" }

export default function AlunoBadgesPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
          Coleção
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Suas badges
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Cada momento marcante no tatame vira uma badge. Continue treinando
          pra desbloquear todas.
        </p>
      </header>

      <XpHero />
      <AchievementsGrid />
    </div>
  )
}
