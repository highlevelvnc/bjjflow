import type { Metadata } from "next"
import { ItemForm } from "./ItemForm"

export const metadata: Metadata = {
  title: "Adicionar Item ao Estoque",
}

export default function NewItemPage() {
  return <ItemForm />
}
