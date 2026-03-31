// Client-safe constants — no server-only imports

export const LOCALES = ["en", "pt-BR", "pt-PT", "de", "fr"] as const
export type Locale = (typeof LOCALES)[number]

export interface CurrencyInfo {
  symbol: string
  code: string
  price: number
  period: string
}

export const LOCALE_CURRENCY: Record<Locale, CurrencyInfo> = {
  en:      { symbol: "$",  code: "USD", price: 49,  period: "/month" },
  "pt-BR": { symbol: "R$", code: "BRL", price: 249, period: "/mês"   },
  "pt-PT": { symbol: "€",  code: "EUR", price: 45,  period: "/mês"   },
  de:      { symbol: "€",  code: "EUR", price: 45,  period: "/Monat" },
  fr:      { symbol: "€",  code: "EUR", price: 45,  period: "/mois"  },
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en:      "English",
  "pt-BR": "Português (BR)",
  "pt-PT": "Português (PT)",
  de:      "Deutsch",
  fr:      "Français",
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en:      "🇺🇸",
  "pt-BR": "🇧🇷",
  "pt-PT": "🇵🇹",
  de:      "🇩🇪",
  fr:      "🇫🇷",
}
