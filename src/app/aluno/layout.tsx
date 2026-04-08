import type { Metadata, Viewport } from "next"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/server/supabase/server"
import { createServerCaller } from "@/lib/trpc/server"
import { BottomNav } from "@/components/aluno/BottomNav"
import { AlunoHeader } from "@/components/aluno/AlunoHeader"

export const metadata: Metadata = {
  title: {
    template: "%s · Kumo Aluno",
    default: "Kumo · Aluno",
  },
}

// Mobile viewport — fits perfectly on phone screens, supports notch/safe areas
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
}

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // NOTE: param key MUST match LoginForm/middleware (`redirectTo`, not `next`).
  // Using the wrong key silently dropped the post-login destination and made
  // the user bounce around after authenticating.
  if (!session) redirect("/login?redirectTo=/aluno")

  const academyId = session.user.app_metadata?.academy_id as string | undefined
  // A logged-in user with no academy_id is in one of two states:
  //   1. Academy owner mid-onboarding → /setup is correct
  //   2. Student who just accepted an invite but whose JWT cookie is stale
  //      → bounce them through the auth callback to force a token refresh
  // The second case is handled by the AcceptInviteButton client-side refresh,
  // but we route to /login here as a safety net (login picks the right
  // destination from the freshly-issued JWT).
  if (!academyId) {
    const role = session.user.app_metadata?.member_role as string | undefined
    redirect(role === "student" ? "/login?redirectTo=/aluno" : "/setup")
  }

  const trpc = await createServerCaller()

  let memberName = session.user.email?.split("@")[0] ?? "Aluno"
  let belt = "white"
  let stripes = 0
  let academyName = "Academia"
  let avatarUrl: string | null = null

  try {
    const [member, academy] = await Promise.all([
      trpc.member.getCurrent(),
      trpc.academy.getCurrent(),
    ])
    if (member) {
      memberName = member.full_name
      belt = member.belt_rank
      stripes = member.stripes
      avatarUrl = member.avatar_url
    }
    academyName = academy.name
  } catch {
    // graceful fallback
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gray-950 text-gray-100">
      {/* Ambient background — high-tech grid + orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Soft brand glow */}
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-cyan-brand/8 blur-[110px]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          }}
        />
        {/* Top scan line */}
        <div className="absolute inset-x-0 top-[10%] h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      </div>

      <AlunoHeader
        name={memberName}
        belt={belt}
        stripes={stripes}
        academyName={academyName}
        avatarUrl={avatarUrl}
      />

      {/* Conteúdo */}
      <main
        className="relative flex-1 px-4 pb-28 pt-3 sm:px-6"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </main>

      <BottomNav />
    </div>
  )
}
