import type { Metadata } from "next"
import { CheckInClient } from "./CheckInClient"

export const metadata: Metadata = { title: "Check-in" }

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Check-in</h1>
      <p className="mb-6 text-sm text-gray-500">
        Selecione uma aula abaixo para fazer check-in hoje&apos;s class.
      </p>
      <CheckInClient autoSessionId={params.session} />
    </div>
  )
}
