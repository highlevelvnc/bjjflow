import type { Metadata } from "next"
import { StudentBillingClient } from "./StudentBillingClient"

export const metadata: Metadata = {
  title: "Student Billing",
}

export default function StudentBillingPage() {
  return <StudentBillingClient />
}
