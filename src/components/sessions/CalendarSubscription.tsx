"use client"

import { useState } from "react"
import { Calendar, Copy, Check, Download } from "lucide-react"

interface CalendarSubscriptionProps {
  academySlug: string
  academyName: string
}

export function CalendarSubscription({ academySlug, academyName }: CalendarSubscriptionProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : ""
  const httpsUrl = `${appUrl}/api/calendar/${academySlug}`
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://")

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webcalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for insecure contexts
      const input = document.createElement("input")
      input.value = webcalUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-500/10 p-2">
          <Calendar className="h-5 w-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-gray-200">Subscribe to Calendar</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Add {academyName}&apos;s schedule to Google Calendar, Apple Calendar, or Outlook.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={webcalUrl}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-400 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Subscribe
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </button>
            <a
              href={httpsUrl}
              download="schedule.ics"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download .ics
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
