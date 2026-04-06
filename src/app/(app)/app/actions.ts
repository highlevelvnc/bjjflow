"use server"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/server/supabase/server"

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function switchAcademy(academyId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await getAdmin().auth.admin.updateUserById(user.id, { app_metadata: { academy_id: academyId } })
  redirect("/app")
}
