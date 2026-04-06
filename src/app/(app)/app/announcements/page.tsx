import type { Metadata } from "next"
import { AnnouncementsClient } from "./AnnouncementsClient"

export const metadata: Metadata = {
  title: "Mural",
}

export default function AnnouncementsPage() {
  return <AnnouncementsClient />
}
