import type { Metadata } from "next"
import { TechniqueExplorer } from "./TechniqueExplorer"

export const metadata: Metadata = { title: "Aprender · Coach Kumo" }

export default function AlunoAprenderPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
          Coach Kumo · Biblioteca BJJ
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Aprender Jiu-Jitsu
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Mais de 30 técnicas curadas em português, do mata-leão ao X-guard.
          Tudo offline, na palma da sua mão.
        </p>
      </header>
      <TechniqueExplorer />
    </div>
  )
}
