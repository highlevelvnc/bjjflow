"use client"

import { useState, useTransition } from "react"
import { Loader2, Building2, Globe, Clock } from "lucide-react"
import { createAcademy } from "./actions"

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 transition-all focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

const selectClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-sm text-white transition-all focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none"

// ── Country / timezone data ─────────────────────────────────────────────────

const COUNTRIES = [
  { code: "BR", label: "Brazil", timezone: "America/Sao_Paulo" },
  { code: "PT", label: "Portugal", timezone: "Europe/Lisbon" },
  { code: "DE", label: "Germany", timezone: "Europe/Berlin" },
  { code: "FR", label: "France", timezone: "Europe/Paris" },
  { code: "OTHER", label: "Other", timezone: "UTC" },
] as const

function getDefaultTimezone(countryCode: string): string {
  const country = COUNTRIES.find((c) => c.code === countryCode)
  if (country) return country.timezone

  // Try browser timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function SetupForm() {
  const [academyName, setAcademyName] = useState("")
  const [countryCode, setCountryCode] = useState("BR")
  const [timezone, setTimezone] = useState(getDefaultTimezone("BR"))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCountryChange(code: string) {
    setCountryCode(code)
    setTimezone(getDefaultTimezone(code))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createAcademy({
        academyName: academyName.trim(),
        countryCode: countryCode === "OTHER" ? "US" : countryCode,
        timezone,
      })

      if (result?.error) {
        setError(result.error)
      }
      // On success the server action redirects — no client-side handling needed
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span className="mt-0.5 shrink-0">&#9888;</span>
          {error}
        </div>
      )}

      {/* Academy Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">
          Academy Name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Alliance BJJ Lisboa"
            className={inputClass}
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">
          Country
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={selectClass}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-gray-900">
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">
          Timezone
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
            placeholder="e.g. America/Sao_Paulo"
            className={inputClass}
          />
        </div>
        <p className="text-xs text-gray-600">
          Auto-detected from your country. Change if needed.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 hover:shadow-brand-500/35 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          "Create Academy"
        )}
      </button>
    </form>
  )
}
