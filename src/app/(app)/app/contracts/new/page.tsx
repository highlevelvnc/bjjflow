import type { Metadata } from "next"
import { ContractForm } from "./ContractForm"

export const metadata: Metadata = {
  title: "New Contract",
}

export default function NewContractPage() {
  return <ContractForm />
}
