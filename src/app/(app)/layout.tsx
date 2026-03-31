import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/server/supabase/server"
import { createServerCaller } from "@/lib/trpc/server"
import { Sidebar } from "@/components/nav/Sidebar"
import type { Role } from "@/types/auth"

export const metadata: Metadata = {
  title: {
    template: "%s | GrapplingFlow",
    default: "Dashboard | GrapplingFlow",
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

  const trpc = await createServerCaller()

  let academyName = "My Academy"
  let memberName = session.user.email ?? "User"
  let memberRole: Role = "student"

  try {
    const [academy, member] = await Promise.all([
      trpc.academy.getCurrent(),
      trpc.member.getCurrent(),
    ])
    academyName = academy.name
    if (member) {
      memberName = member.full_name
      memberRole = member.role as Role
    }
  } catch {
    // Non-fatal — sidebar falls back to defaults above
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar academyName={academyName} memberName={memberName} memberRole={memberRole} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-8 py-6 text-gray-100">{children}</main>
      </div>
    </div>
  )
}
