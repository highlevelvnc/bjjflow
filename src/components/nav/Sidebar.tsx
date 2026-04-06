"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Dumbbell, CalendarDays,
  BookOpen, FileSignature, CalendarHeart, MessageSquare, ShoppingBag,
  QrCode, BarChart3, BarChart2, Receipt, Trophy, ScrollText, CreditCard, Settings,
  LogOut, Menu, X,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Role } from "@/types/auth"
import { ROLE_LABELS } from "@/lib/constants/roles"
import { createBrowserSupabase } from "@/server/supabase/browser"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/app",              icon: LayoutDashboard },
  { label: "Members",      href: "/app/members",      icon: Users },
  { label: "Classes",      href: "/app/classes",       icon: Dumbbell },
  { label: "Sessions",     href: "/app/sessions",      icon: CalendarDays },
  { label: "Techniques",   href: "/app/techniques",    icon: BookOpen },
  { label: "Contracts",    href: "/app/contracts",      icon: FileSignature },
  { label: "Events",       href: "/app/events",         icon: CalendarHeart },
  { label: "Feed",         href: "/app/announcements",  icon: MessageSquare },
  { label: "Inventory",    href: "/app/inventory",      icon: ShoppingBag },
  { label: "Check In",     href: "/app/checkin",        icon: QrCode },
  { label: "My Progress",  href: "/app/portal",         icon: BarChart3 },
  { label: "Leaderboard",  href: "/app/leaderboard",    icon: Trophy },
  { label: "Student Billing",href: "/app/student-billing",icon: Receipt },
  { label: "Analytics",    href: "/app/analytics",      icon: BarChart2 },
  { label: "Audit Log",    href: "/app/audit",          icon: ScrollText },
  { label: "Billing",      href: "/app/billing",        icon: CreditCard },
  { label: "Settings",     href: "/app/settings",       icon: Settings },
]

interface SidebarProps {
  academyName: string
  memberName: string
  memberRole: Role
}

export function Sidebar({ academyName, memberName, memberRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navContent = (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4">
        <Image src="/kumologo.png" alt="Kumo" width={28} height={28} className="shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{academyName}</p>
        </div>
        {/* Close button on mobile */}
        <button onClick={() => setOpen(false)} className="ml-auto text-gray-500 hover:text-white md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-brand-500/12 text-brand-300 shadow-sm"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-400" : "text-gray-500")} />
                  {item.label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300">
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-200">{memberName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[memberRole]}</p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-white/8 bg-gray-950 px-4 md:hidden">
        <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/kumologo.png" alt="Kumo" width={24} height={24} className="rounded-md" />
        <span className="truncate text-sm font-semibold text-white">{academyName}</span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slides in */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/8 bg-gray-950 transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
