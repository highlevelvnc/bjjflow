"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Dumbbell, CalendarDays,
  BookOpen, FileSignature, CalendarHeart, MessageSquare, ShoppingBag,
  QrCode, BarChart3, BarChart2, Receipt, Trophy, Medal, ScrollText, CreditCard, Settings,
  LogOut, Menu, X, Activity,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils/cn"
import type { Role } from "@/types/auth"
import { ROLE_LABELS } from "@/lib/constants/roles"
import { createBrowserSupabase } from "@/server/supabase/browser"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { getAppMessagesSync } from "@/lib/i18n/app-messages"

interface NavDef {
  key: string
  href: string
  icon: React.ElementType
  group?: string
}

const NAV_DEFS: NavDef[] = [
  { key: "dashboard",      href: "/app",                icon: LayoutDashboard,  group: "main" },
  { key: "members",        href: "/app/members",        icon: Users,            group: "main" },
  { key: "classes",        href: "/app/classes",        icon: Dumbbell,         group: "main" },
  { key: "sessions",       href: "/app/sessions",       icon: CalendarDays,     group: "main" },
  { key: "checkin",        href: "/app/checkin",        icon: QrCode,           group: "main" },
  { key: "techniques",     href: "/app/techniques",     icon: BookOpen,         group: "academy" },
  { key: "contracts",      href: "/app/contracts",      icon: FileSignature,    group: "academy" },
  { key: "events",         href: "/app/events",         icon: CalendarHeart,    group: "academy" },
  { key: "feed",           href: "/app/announcements",  icon: MessageSquare,    group: "academy" },
  { key: "inventory",      href: "/app/inventory",      icon: ShoppingBag,      group: "academy" },
  { key: "portal",         href: "/app/portal",         icon: BarChart3,        group: "student" },
  { key: "myPerformance",  href: "/aluno/performance",  icon: Activity,         group: "student" },
  { key: "titles",         href: "/app/titles",         icon: Medal,            group: "student" },
  { key: "leaderboard",    href: "/app/leaderboard",    icon: Trophy,           group: "student" },
  { key: "studentBilling", href: "/app/student-billing",icon: Receipt,          group: "finance" },
  { key: "analytics",      href: "/app/analytics",      icon: BarChart2,        group: "finance" },
  { key: "auditLog",       href: "/app/audit",          icon: ScrollText,       group: "finance" },
  { key: "billing",        href: "/app/billing",        icon: CreditCard,       group: "settings" },
  { key: "settings",       href: "/app/settings",       icon: Settings,         group: "settings" },
]

const GROUP_LABELS: Record<string, string> = {
  main: "Principal",
  academy: "Academia",
  student: "Alunos",
  finance: "Financeiro",
  settings: "Sistema",
}

interface SidebarProps {
  academyName: string
  memberName: string
  memberRole: Role
  locale: string
}

export function Sidebar({ academyName, memberName, memberRole, locale }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const t = getAppMessagesSync(locale)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Group nav items
  const groups = ["main", "academy", "student", "finance", "settings"]

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="relative flex h-14 items-center gap-2.5 px-4">
        {/* Gradient underline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-7 w-7 rounded-lg bg-brand-500 shadow-lg shadow-brand-500/40">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400/50 to-transparent" />
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-[11px] font-black tracking-tighter text-white">K</span>
              </div>
            </div>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">Kumo</span>
        </div>
        <div className="mx-1 h-3.5 w-px bg-white/15" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-400">{academyName}</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white md:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => {
          const items = NAV_DEFS.filter((d) => d.group === group)
          return (
            <div key={group} className="mb-4">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {GROUP_LABELS[group]}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    item.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(item.href)
                  const Icon = item.icon
                  const label = t.nav[item.key] ?? item.key

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150",
                          isActive
                            ? "bg-brand-500/15 text-brand-300"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                        )}
                      >
                        {/* Active left bar */}
                        {isActive && (
                          <motion.div
                            layoutId="activeBar"
                            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-400"
                            initial={false}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isActive ? "text-brand-400" : "text-gray-500 group-hover:text-gray-300",
                          )}
                        />
                        <span className="truncate font-medium">{label}</span>
                        {isActive && (
                          <span className="ml-auto h-1 w-1 rounded-full bg-brand-400/80" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-3 pt-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="flex items-center gap-2.5 rounded-xl bg-white/4 px-3 py-2">
          {/* Avatar with glow */}
          <div className="relative shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-md shadow-brand-500/30">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-gray-950 bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-200">{memberName}</p>
            <p className="text-[10px] text-gray-500">{ROLE_LABELS[memberRole]}</p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair"
            className="shrink-0 rounded-md p-1 text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-white/8 bg-gray-950/90 px-4 backdrop-blur-xl md:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/8 hover:text-white">
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-brand-500 flex items-center justify-center">
            <span className="text-[9px] font-black text-white">K</span>
          </div>
          <span className="text-sm font-bold text-white">Kumo</span>
        </div>
        <div className="h-3.5 w-px bg-white/15" />
        <span className="truncate text-xs text-gray-400">{academyName}</span>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/8 bg-gray-950/95 backdrop-blur-xl transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
