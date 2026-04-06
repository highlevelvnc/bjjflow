"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { CalendarHeart, Plus, Loader2, MapPin, Clock } from "lucide-react"

const EVENT_TYPE_STYLES: Record<string, string> = {
  seminar: "bg-purple-500/15 text-purple-400",
  competition: "bg-red-500/15 text-red-400",
  social: "bg-green-500/15 text-green-400",
  workshop: "bg-blue-500/15 text-blue-400",
  other: "bg-gray-500/15 text-gray-400",
}

export function EventsClient() {
  const [showPast, setShowPast] = useState(false)
  const { data, isLoading } = trpc.event.list.useQuery({ includePast: showPast })

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function formatTime(time: string | null) {
    if (!time) return null
    // time is HH:MM or HH:MM:SS
    const [h, m] = time.split(":")
    return `${h}:${m}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Eventos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `${data.total} evento${data.total === 1 ? "" : "s"}` : "Carregando..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-brand-500"
            />
            Mostrar passados
          </label>
          <Link
            href="/app/events/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Link>
        </div>
      </div>

      {/* Event cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-10 text-center">
          <CalendarHeart className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">Nenhum evento programado</p>
          <p className="mt-1 text-xs text-gray-600">
            Crie seu primeiro evento para manter sua academia informada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((event) => {
            const typeStyle = EVENT_TYPE_STYLES[event.event_type] ?? EVENT_TYPE_STYLES.other
            const startTime = formatTime(event.start_time)
            const endTime = formatTime(event.end_time)

            return (
              <div
                key={event.id}
                className="rounded-xl border border-white/8 bg-gray-900 p-5 transition-colors hover:border-white/12"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeStyle}`}
                      >
                        {event.event_type}
                      </span>
                      {event.is_public && (
                        <span className="inline-flex items-center rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">
                          Público
                        </span>
                      )}
                      {event.registration_required && (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          Inscrição Obrigatória
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-100">{event.title}</h3>
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{event.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarHeart className="h-3.5 w-3.5" />
                        {formatDate(event.start_date)}
                        {event.end_date && event.end_date !== event.start_date && (
                          <> &ndash; {formatDate(event.end_date)}</>
                        )}
                      </span>
                      {startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {startTime}
                          {endTime && <> &ndash; {endTime}</>}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      {event.max_participants && (
                        <span>Máx: {event.max_participants} participantes</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
