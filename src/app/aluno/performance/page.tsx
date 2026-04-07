import type { Metadata } from "next"
import { StudentPerformanceSection } from "./StudentPerformanceSection"

export const metadata: Metadata = { title: "Seu Desempenho" }

export default function StudentPerformancePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400">
              Área do Aluno
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
              Seu Desempenho
            </h1>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Acompanhe sua evolução técnica, mantenha consistência e visualize seus
          pontos fortes no radar.
        </p>
      </header>

      <StudentPerformanceSection />
    </div>
  )
}
