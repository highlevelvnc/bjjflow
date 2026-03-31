"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { setLocale } from "@/lib/i18n/actions"
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "@/lib/i18n/config"

export function LocaleSwitcher({ current }: { current: Locale }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="flex items-center gap-1 text-gray-400">
      <Globe className="h-3.5 w-3.5 shrink-0 text-gray-500" />
      <select
        value={current}
        disabled={isPending}
        aria-label="Change language"
        onChange={(e) => {
          const locale = e.target.value as Locale
          startTransition(async () => {
            await setLocale(locale)
            router.refresh()
          })
        }}
        className="cursor-pointer appearance-none border-none bg-transparent text-xs text-gray-400 outline-none transition-colors hover:text-white disabled:opacity-50"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} className="bg-gray-900 text-white">
            {LOCALE_FLAGS[locale]} {LOCALE_NAMES[locale]}
          </option>
        ))}
      </select>
    </div>
  )
}
