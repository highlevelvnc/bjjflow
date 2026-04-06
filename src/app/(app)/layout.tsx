import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/server/supabase/server"
import { createServerCaller } from "@/lib/trpc/server"
import { Sidebar } from "@/components/nav/Sidebar"
import { TrialBanner } from "@/components/ui/TrialBanner"
import { OnboardingTour } from "@/components/onboarding/OnboardingTour"
import type { Role } from "@/types/auth"
import { getLocale } from "@/lib/i18n"

export const metadata: Metadata = {
  title: {
    template: "%s | Kumo",
    default: "Dashboard | Kumo",
  },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const academyId = session.user.app_metadata?.academy_id as string | undefined
  if (!academyId) {
    redirect("/setup")
  }

  const locale = await getLocale()
  const trpc = await createServerCaller()

  let academyName = "My Academy"
  let memberName = session.user.email ?? "User"
  let memberRole: Role = "student"
  let academyStatus = "active"

  try {
    const [academy, member] = await Promise.all([
      trpc.academy.getCurrent(),
      trpc.member.getCurrent(),
    ])
    academyName = academy.name
    academyStatus = academy.status
    if (member) {
      memberName = member.full_name
      memberRole = member.role as Role
    }
  } catch {
    // Non-fatal — sidebar falls back to defaults above
  }

  return (
    <div className="relative flex min-h-screen bg-gray-950">
      {/* Ambient background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-20 h-[500px] w-[500px] rounded-full bg-brand-600/8 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-[400px] w-[400px] rounded-full bg-cyan-brand/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/4 blur-[80px]" />
      </div>
      <Sidebar academyName={academyName} memberName={memberName} memberRole={memberRole} locale={locale} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {academyStatus === "trialing" && <TrialBanner />}
        <main className="flex-1 px-6 py-6 pt-20 text-gray-100 md:px-8 md:pt-6">{children}</main>
      </div>
      <OnboardingTour />
    </div>
  )
}
