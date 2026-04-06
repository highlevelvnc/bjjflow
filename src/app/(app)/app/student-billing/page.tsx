import type { Metadata } from "next"
import { StudentBillingClient } from "./StudentBillingClient"

export const metadata: Metadata = {
  title: "Mensalidades",
}

export default function StudentBillingPage() {
  return <StudentBillingClient />
}
