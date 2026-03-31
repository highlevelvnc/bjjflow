import { cookies, headers } from "next/headers"
export { LOCALES, LOCALE_CURRENCY, LOCALE_NAMES, LOCALE_FLAGS } from "./config"
export type { Locale, CurrencyInfo } from "./config"

// Country code → locale (ISO 3166-1 alpha-2)
const COUNTRY_TO_LOCALE: Record<string, string> = {
  BR: "pt-BR",
  PT: "pt-PT",
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  MZ: "pt-PT",
  AO: "pt-PT",
  CV: "pt-PT",
}

const LOCALES_ARRAY = ["en", "pt-BR", "pt-PT", "de", "fr"] as const
type Locale = (typeof LOCALES_ARRAY)[number]

function parseAcceptLanguage(header: string): Locale {
  const langs = header
    .split(",")
    .map((l) => {
      const parts = l.trim().split(";q=")
      const lang = parts[0] ?? ""
      const q = parts[1]
      return { lang: lang.trim().toLowerCase(), q: parseFloat(q ?? "1") }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of langs) {
    if (lang.startsWith("pt-br")) return "pt-BR"
    if (lang.startsWith("pt-pt")) return "pt-PT"
    if (lang.startsWith("pt"))    return "pt-BR"
    if (lang.startsWith("de"))    return "de"
    if (lang.startsWith("fr"))    return "fr"
    if (lang.startsWith("en"))    return "en"
  }
  return "en"
}

export async function getLocale(): Promise<Locale> {
  // 1. User-set cookie takes highest priority
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value
  if (cookieLocale && (LOCALES_ARRAY as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale
  }

  const headersList = await headers()

  // 2. Vercel injects the visitor's country automatically
  const country = headersList.get("x-vercel-ip-country")
  if (country && COUNTRY_TO_LOCALE[country]) {
    return COUNTRY_TO_LOCALE[country] as Locale
  }

  // 3. Browser Accept-Language as fallback (good for local dev)
  const acceptLang = headersList.get("accept-language") ?? ""
  if (acceptLang) return parseAcceptLanguage(acceptLang)

  return "en"
}
