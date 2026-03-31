// Client-safe constants — no server-only imports

export const LOCALES = ["en", "pt-BR", "pt-PT", "de", "fr"] as const
export type Locale = (typeof LOCALES)[number]

export interface PlanPricing {
  name: string
  price: number
  popular?: boolean
}

export interface CurrencyInfo {
  symbol: string
  code: string
  period: string
  plans: PlanPricing[]
}

export const LOCALE_CURRENCY: Record<Locale, CurrencyInfo> = {
  en: {
    symbol: "$", code: "USD", period: "/month",
    plans: [
      { name: "Starter", price: 30 },
      { name: "Growth", price: 60, popular: true },
      { name: "Pro", price: 100 },
    ],
  },
  "pt-BR": {
    symbol: "R$", code: "BRL", period: "/mês",
    plans: [
      { name: "Starter", price: 60 },
      { name: "Growth", price: 120, popular: true },
      { name: "Pro", price: 200 },
    ],
  },
  "pt-PT": {
    symbol: "€", code: "EUR", period: "/mês",
    plans: [
      { name: "Starter", price: 20 },
      { name: "Growth", price: 40, popular: true },
      { name: "Pro", price: 70 },
    ],
  },
  de: {
    symbol: "€", code: "EUR", period: "/Monat",
    plans: [
      { name: "Starter", price: 20 },
      { name: "Growth", price: 40, popular: true },
      { name: "Pro", price: 70 },
    ],
  },
  fr: {
    symbol: "€", code: "EUR", period: "/mois",
    plans: [
      { name: "Starter", price: 20 },
      { name: "Growth", price: 40, popular: true },
      { name: "Pro", price: 70 },
    ],
  },
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
