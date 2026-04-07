import type { Metadata } from "next"
import { AlunoHomeClient } from "./AlunoHomeClient"

export const metadata: Metadata = { title: "Início" }

export default function AlunoHomePage() {
  return <AlunoHomeClient />
}
