import type { Metadata } from "next"
import { EventForm } from "./EventForm"

export const metadata: Metadata = {
  title: "New Event",
}

export default function NewEventPage() {
  return <EventForm />
}
