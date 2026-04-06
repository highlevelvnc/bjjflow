"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

interface SettingsFormProps {
  initialData: {
    name: string
    timezone: string
    allow_student_self_checkin: boolean
    allow_student_portal: boolean
  }
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
]

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name)
  const [timezone, setTimezone] = useState(initialData.timezone)
  const [selfCheckin, setSelfCheckin] = useState(initialData.allow_student_self_checkin)
  const [studentPortal, setStudentPortal] = useState(initialData.allow_student_portal)
  const [saved, setSaved] = useState(false)

  const updateSettings = trpc.academy.updateSettings.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateSettings.mutate({
      name,
      timezone,
      allow_student_self_checkin: selfCheckin,
      allow_student_portal: studentPortal,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Academy info */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-100">Academy Info</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
              Academy Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              placeholder="My Academy"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-gray-300">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-100">Features</h2>

        <div className="space-y-4">
          {/* Self check-in toggle */}
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Student Self Check-in</p>
              <p className="text-xs text-gray-500">Allow students to check themselves in via QR code.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={selfCheckin}
              onClick={() => setSelfCheckin(!selfCheckin)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                selfCheckin ? "bg-brand-500" : "bg-white/12"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  selfCheckin ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {/* Student portal toggle */}
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Student Portal</p>
              <p className="text-xs text-gray-500">Let students log in and view their progress.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={studentPortal}
              onClick={() => setStudentPortal(!studentPortal)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                studentPortal ? "bg-brand-500" : "bg-white/12"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  studentPortal ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Settings saved.</span>
        )}
        {updateSettings.isError && (
          <span className="text-sm text-red-400">Failed to save. Please try again.</span>
        )}
      </div>
    </form>
  )
}
