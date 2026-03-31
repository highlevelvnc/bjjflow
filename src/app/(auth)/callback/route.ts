import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Auth callback handler.
 *
 * Supabase redirects here after email verification (or magic link / OAuth).
 * We exchange the auth code for a session, then redirect the user:
 *   - /setup  — if they have no academy yet (new signup)
 *   - /app    — if they already belong to an academy
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(
            cookiesToSet: {
              name: string
              value: string
              options: CookieOptions
            }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const academyId = data.session.user.app_metadata?.academy_id as
        | string
        | undefined

      const redirectUrl = new URL(
        academyId ? "/app" : "/setup",
        request.url,
      )
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Fallback: code missing or exchange failed — send to login
  return NextResponse.redirect(new URL("/login", request.url))
}
