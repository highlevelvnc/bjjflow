import type { Metadata } from "next"
import { PlanForm } from "./PlanForm"

export const metadata: Metadata = {
  title: "Novo Plano de Aluno",
}

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Novo Plano de Aluno</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Crie um plano de cobrança para um aluno. O primeiro pagamento será gerado automaticamente.
        </p>
      </div>

      <PlanForm />
    </div>
  )
}
