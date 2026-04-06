import type { Metadata } from "next"
import { EventForm } from "./EventForm"

export const metadata: Metadata = {
  title: "Novo Evento",
}

export default function NewEventPage() {
  return <EventForm />
}
