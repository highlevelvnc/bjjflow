import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareSupabase } from "@/server/supabase/middleware"

// ─────────────────────────────────────────────────────────────────────────────
// Route matchers
// ─────────────────────────────────────────────────────────────────────────────

/** Routes that are always public — no session required. */
const PUBLIC_ROUTES = ["/pricing", "/features", "/contact"]

/** Auth routes — redirect to /dashboard if already signed in. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"]

/** Onboarding — requires session but no academy yet. */
const ONBOARDING_PREFIX = "/setup"

/** Routes that handle their own auth (webhooks, cron). */
const BYPASS_PREFIXES = ["/api/webhooks/", "/api/cron/", "/api/trpc/", "/_next/", "/favicon"]

// ─────────────────────────────────────────────────────────────────────────────
// Helper predicates
// ─────────────────────────────────────────────────────────────────────────────

function isBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname)
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname.startsWith(r))
}

function isOnboarding(pathname: string): boolean {
  return pathname.startsWith(ONBOARDING_PREFIX) || pathname.startsWith("/plan") || pathname.startsWith("/complete")
}

function isStatusRoute(pathname: string): boolean {
  return pathname.startsWith("/suspended") || pathname.startsWith("/member-suspended") || pathname.startsWith("/reactivate")
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bypass — no session work needed for these routes.
  if (isBypass(pathname)) {
    return NextResponse.next()
  }

  // 2. Create response early so we can attach refreshed session cookies.
  const response = NextResponse.next({ request })

  // 3. Refresh session. This is the ONLY reason Supabase is called in middleware.
  //    It does NOT make authorization decisions — that's the tRPC layer's job.
  const supabase = createMiddlewareSupabase(request, response)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 4. Public marketing routes — always accessible.
  if (isPublic(pathname)) {
    return response
  }

  // 5. Auth routes — redirect authenticated users away.
  if (isAuthRoute(pathname)) {
    if (session) {
      const academyId = session.user.app_metadata?.academy_id as string | undefined
      return NextResponse.redirect(
        new URL(academyId ? "/" : "/setup", request.url),
      )
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

  // 7. Status routes (suspended/reactivate) — allow any authenticated user through.
  if (isStatusRoute(pathname)) {
    return response
  }

  // 8. Onboarding — requires session but must NOT have an academy yet.
  if (isOnboarding(pathname)) {
    if (academyId) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return response
  }

  // 9. Dashboard routes — require both session and academy context.
  //    If no academy_id in JWT, the user hasn't completed onboarding.
  if (!academyId) {
    return NextResponse.redirect(new URL("/setup", request.url))
  }

  // 10. All dashboard routes with a valid session + academy — pass through.
  //     Role-based authorization is enforced at the tRPC layer (procedures.ts)
  //     and by server-side guards. NOT in middleware.
  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
