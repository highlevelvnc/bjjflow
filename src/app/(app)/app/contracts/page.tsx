import type { Metadata } from "next"
import { ContractsClient } from "./ContractsClient"

export const metadata: Metadata = {
  title: "Contratos",
}

export default function ContractsPage() {
  return <ContractsClient />
}
