import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareSupabase } from "@/server/supabase/middleware"

// ─────────────────────────────────────────────────────────────────────────────
// Route matchers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Public marketing routes — no session required.
 * "/" is the landing page and is always public.
 */
const PUBLIC_PREFIXES = ["/", "/pricing", "/features", "/contact"]

/** Auth routes — redirect to /app if already signed in. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"]

/** Onboarding — requires session but no academy yet. */
const ONBOARDING_PREFIX = "/setup"

/** Routes that handle their own auth (webhooks, cron, tRPC). */
const BYPASS_PREFIXES = ["/api/webhooks/", "/api/cron/", "/api/trpc/", "/_next/", "/favicon"]

// ─────────────────────────────────────────────────────────────────────────────
// Helper predicates
// ─────────────────────────────────────────────────────────────────────────────

function isBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isPublic(pathname: string): boolean {
  // "/" is exact-match public; other public prefixes are prefix-matched
  return pathname === "/" || PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname.startsWith(r))
}

function isOnboarding(pathname: string): boolean {
  return (
    pathname.startsWith(ONBOARDING_PREFIX) ||
    pathname.startsWith("/plan") ||
    pathname.startsWith("/complete")
  )
}

function isStatusRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/suspended") ||
    pathname.startsWith("/member-suspended") ||
    pathname.startsWith("/reactivate")
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bypass — no session work needed.
  if (isBypass(pathname)) {
    return NextResponse.next()
  }

  // 2. Create response early so refreshed session cookies can be attached.
  const response = NextResponse.next({ request })

  // 3. Refresh session. The only reason Supabase is called in middleware.
  //    Authorization decisions are made by tRPC procedures — NOT here.
  const supabase = createMiddlewareSupabase(request, response)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 4. Public marketing routes — always pass through.
  if (isPublic(pathname)) {
    return response
  }

  // 5. Auth routes — redirect already-authenticated users to the app.
  if (isAuthRoute(pathname)) {
    if (session) {
      const academyId = session.user.app_metadata?.academy_id as string | undefined
      return NextResponse.redirect(new URL(academyId ? "/app" : "/setup", request.url))
    }
    return response
  }

  // 6. Unauthenticated users — send to login for all protected routes.
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const academyId = session.user.app_metadata?.academy_id as string | undefined

  // 7. Status routes — allow any authenticated user through.
  if (isStatusRoute(pathname)) {
    return response
  }

  // 8. Onboarding — session required, but must NOT have an academy yet.
  if (isOnboarding(pathname)) {
    if (academyId) {
      return NextResponse.redirect(new URL("/app", request.url))
    }
    return response
  }

  // 9. App routes — require both session and academy context.
  if (!academyId) {
    return NextResponse.redirect(new URL("/setup", request.url))
  }

  // 10. Fully authenticated + academy context — pass through.
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
