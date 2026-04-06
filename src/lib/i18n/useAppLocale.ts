"use client"
import { useMemo } from "react"
import { appMessages, type AppMessages } from "./app-messages"

export function useAppMessages(): AppMessages {
  return useMemo(() => {
    if (typeof document === "undefined") return appMessages.en!
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("NEXT_LOCALE="))
    const locale = cookie ? cookie.split("=")[1] ?? "en" : "en"
    return appMessages[locale] ?? appMessages.en!
  }, [])
}
