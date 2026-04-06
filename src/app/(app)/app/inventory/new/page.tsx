import type { Metadata } from "next"
import { ItemForm } from "./ItemForm"

export const metadata: Metadata = {
  title: "Add Inventory Item",
}

export default function NewItemPage() {
  return <ItemForm />
}
