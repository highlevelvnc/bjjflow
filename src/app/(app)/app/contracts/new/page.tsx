import type { Metadata } from "next"
import { ContractForm } from "./ContractForm"

export const metadata: Metadata = {
  title: "Novo Contrato",
}

export default function NewContractPage() {
  return <ContractForm />
}
