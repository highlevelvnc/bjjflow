import type { Metadata } from "next"
import { TechniqueClient } from "./TechniqueClient"

export const metadata: Metadata = {
  title: "Techniques",
}

export default function TechniquesPage() {
  return <TechniqueClient />
}
