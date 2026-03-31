import type { Metadata } from "next"
import { CheckInClient } from "./CheckInClient"

export const metadata: Metadata = { title: "Check In" }

export default function CheckInPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-gray-100">Check In</h1>
      <p className="mb-6 text-sm text-gray-500">
        Select a session below to check in for today&apos;s class.
      </p>
      <CheckInClient />
    </div>
  )
}
