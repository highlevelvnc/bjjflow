import type { Metadata } from "next"
import { MuralList } from "./MuralList"

export const metadata: Metadata = { title: "Mural" }

export default function AlunoMuralPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
          Mural da academia
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Avisos e novidades
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Tudo o que sua academia publicou pra você ficar por dentro.
        </p>
      </header>
      <MuralList />
    </div>
  )
}
