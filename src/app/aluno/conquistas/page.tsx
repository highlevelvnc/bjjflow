import type { Metadata } from "next"
import { TitlesList } from "./TitlesList"

export const metadata: Metadata = { title: "Conquistas" }

export default function AlunoConquistasPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          Hall da fama
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Suas conquistas
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Títulos, medalhas e momentos memoráveis dos seus campeonatos.
        </p>
      </header>
      <TitlesList />
    </div>
  )
}
