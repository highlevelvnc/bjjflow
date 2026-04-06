import type { Metadata } from "next"
import { PortalClient } from "./PortalClient"

export const metadata: Metadata = { title: "Meu Progresso" }

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Meu Progresso</h1>
      <p className="mb-6 text-sm text-gray-500">
        Acompanhe sua frequência, jornada de faixa e estatísticas de treino.
      </p>
      <PortalClient />
    </div>
  )
}
