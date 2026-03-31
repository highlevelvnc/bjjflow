"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { type Locale, LOCALES } from "./config"

export async function setLocale(locale: Locale) {
  if (!(LOCALES as readonly string[]).includes(locale)) return
  const cookieStore = await cookies()
  cookieStore.set("NEXT_LOCALE", locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  })
  revalidatePath("/", "layout")
}
