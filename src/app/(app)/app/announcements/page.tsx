import type { Metadata } from "next"
import { AnnouncementsClient } from "./AnnouncementsClient"

export const metadata: Metadata = {
  title: "Announcements",
}

export default function AnnouncementsPage() {
  return <AnnouncementsClient />
}
