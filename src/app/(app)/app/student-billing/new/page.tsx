import type { Metadata } from "next"
import { PlanForm } from "./PlanForm"

export const metadata: Metadata = {
  title: "New Student Plan",
}

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">New Student Plan</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Create a billing plan for a student. The first payment will be generated automatically.
        </p>
      </div>

      <PlanForm />
    </div>
  )
}
