"use server"

import { redirect } from "next/navigation"
import { createServerSupabase } from "@/server/supabase/server"
import { supabaseAdmin } from "@/server/supabase/admin"

// ── Country → defaults mapping ─────────────────────────────────────────────

const COUNTRY_TIMEZONES: Record<string, string> = {
  BR: "America/Sao_Paulo",
  PT: "Europe/Lisbon",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
}

const COUNTRY_CURRENCIES: Record<string, "BRL" | "EUR"> = {
  BR: "BRL",
  PT: "EUR",
  DE: "EUR",
  FR: "EUR",
}

// ── Slug helper ─────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)

  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

// ── Server action ───────────────────────────────────────────────────────────

interface SetupInput {
  academyName: string
  countryCode: string
  timezone: string
}

export async function createAcademy(input: SetupInput) {
  // 1. Get current user session
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in to create an academy." }
  }

  // Guard: user already has an academy
  if (user.app_metadata?.academy_id) {
    redirect("/app")
  }

  const slug = generateSlug(input.academyName)
  const currency = COUNTRY_CURRENCIES[input.countryCode] ?? "EUR"
  const timezone =
    input.timezone || COUNTRY_TIMEZONES[input.countryCode] || "UTC"

  // 2. Insert academy (service role — RLS blocks user inserts)
  const { data: academy, error: academyError } = await supabaseAdmin
    .from("academies")
    .insert({
      name: input.academyName.trim(),
      slug,
      owner_id: user.id,
      country_code: input.countryCode,
      currency,
      timezone,
    })
    .select("id")
    .single()

  if (academyError || !academy) {
    console.error("Failed to create academy:", JSON.stringify(academyError, null, 2))
    return { error: `Failed to create academy: ${academyError?.message ?? "Unknown error"}. Please check your Supabase connection and ensure migrations have been run.` }
  }

  // 3. Insert owner as first member (admin)
  const { error: memberError } = await supabaseAdmin.from("members").insert({
    academy_id: academy.id,
    user_id: user.id,
    full_name:
      (user.user_metadata?.full_name as string) || user.email || "Owner",
    email: user.email,
    role: "admin",
    has_portal_access: true,
    status: "active",
  })

  if (memberError) {
    console.error("Failed to create member:", JSON.stringify(memberError, null, 2))
    // Clean up the academy we just created
    await supabaseAdmin.from("academies").delete().eq("id", academy.id)
    return { error: "Failed to set up your profile. Please try again." }
  }

  // 4. Set academy_id in user's app_metadata so JWT carries it
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: { academy_id: academy.id },
    },
  )

  if (metaError) {
    console.error("Failed to update user metadata:", metaError)
    return { error: "Account setup failed. Please try again." }
  }

  // 5. Redirect to app — middleware will refresh session & pick up new JWT
  redirect("/app")
}
