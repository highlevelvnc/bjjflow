import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabase } from "@/server/supabase/server"

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

const BELT_HEX: Record<string, string> = { white: "#e5e7eb", blue: "#2563eb", purple: "#7c3aed", brown: "#92400e", black: "#1f2937", coral: "#f97316", red_black: "#dc2626", red_white: "#ef4444", red: "#dc2626" }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const academyId = user.app_metadata?.academy_id as string
  if (!academyId) return NextResponse.json({ error: "No academy" }, { status: 400 })

  const admin = getAdmin()
  const [memberRes, academyRes, attendanceRes] = await Promise.all([
    admin.from("members").select("*").eq("id", memberId).eq("academy_id", academyId).single(),
    admin.from("academies").select("name").eq("id", academyId).single(),
    admin.from("attendance").select("id", { count: "exact", head: true }).eq("academy_id", academyId).eq("member_id", memberId),
  ])

  const m = memberRes.data
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const beltColor = BELT_HEX[m.belt_rank] ?? "#6b7280"
  const totalSessions = attendanceRes.count ?? 0

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Member Card — ${m.full_name}</title>
    <style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;display:flex;justify-content:center}@media print{button{display:none}}</style>
  </head><body>
    <div style="width:400px;border:2px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#030712,#1e1b4b);padding:32px;text-align:center;color:white;">
        <div style="width:72px;height:72px;border-radius:50%;background:${beltColor};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;border:3px solid rgba(255,255,255,0.2);">
          ${m.full_name.charAt(0)}
        </div>
        <h1 style="margin:0;font-size:22px;">${m.full_name}</h1>
        <p style="margin:4px 0 0;opacity:0.7;font-size:14px;text-transform:capitalize;">${m.role}</p>
      </div>
      <div style="padding:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div style="height:24px;flex:1;border-radius:12px;background:${beltColor};"></div>
          <span style="font-size:13px;color:#888;">${m.belt_rank.replace("_", " ")} belt · ${m.stripes} stripe${m.stripes !== 1 ? "s" : ""}</span>
        </div>
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:6px 0;color:#888;">Academy</td><td style="text-align:right;font-weight:600;">${academyRes.data?.name ?? ""}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Member since</td><td style="text-align:right;">${new Date(m.created_at).toLocaleDateString()}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Total sessions</td><td style="text-align:right;font-weight:600;">${totalSessions}</td></tr>
          ${m.email ? `<tr><td style="padding:6px 0;color:#888;">Email</td><td style="text-align:right;">${m.email}</td></tr>` : ""}
        </table>
      </div>
      <div style="padding:12px 24px 24px;text-align:center;">
        <button onclick="window.print()" style="padding:8px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;">Print Card</button>
      </div>
      <div style="border-top:1px solid #eee;padding:8px;text-align:center;"><span style="font-size:10px;color:#ccc;">GrapplingFlow</span></div>
    </div>
  </body></html>`

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
