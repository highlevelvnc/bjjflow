import type { Metadata } from "next"
import { ContractView } from "./ContractView"

export const metadata: Metadata = {
  title: "Contract",
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContractView contractId={id} />
}
