import type { Metadata } from "next"
import { EventsClient } from "./EventsClient"

export const metadata: Metadata = {
  title: "Eventos",
}

export default function EventsPage() {
  return <EventsClient />
}
