import type { Metadata } from "next"
import { StudentPerformanceSection } from "./StudentPerformanceSection"

export const metadata: Metadata = { title: "Seu Desempenho" }

export default function StudentPerformancePage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
          Seu Desempenho
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Acompanhe sua evolução por técnica
        </p>
      </header>

      <StudentPerformanceSection />
    </div>
  )
}
