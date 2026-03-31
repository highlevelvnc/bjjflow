"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Dumbbell, CalendarDays, QrCode, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Role } from "@/types/auth"
import { ROLE_LABELS } from "@/lib/constants/roles"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app",          icon: LayoutDashboard },
  { label: "Members",   href: "/app/members",  icon: Users },
  { label: "Classes",   href: "/app/classes",  icon: Dumbbell },
  { label: "Sessions",  href: "/app/sessions", icon: CalendarDays },
  { label: "Check In",  href: "/app/checkin",  icon: QrCode },
  { label: "My Progress",href: "/app/portal",  icon: BarChart3 },
]

interface SidebarProps {
  academyName: string
  memberName: string
  memberRole: Role
}

export function Sidebar({ academyName, memberName, memberRole }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-white/8 bg-gray-950">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 shadow-md shadow-brand-500/30">
          <span className="text-[11px] font-black text-white">BF</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{academyName}</p>
        </div>
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
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-brand-500/12 text-brand-300 shadow-sm"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-brand-400" : "text-gray-500",
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-white/8 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar initial */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300">
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-200">{memberName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[memberRole]}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
