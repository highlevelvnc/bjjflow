"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import type { Role } from "@/types/auth"
import { ROLE_LABELS } from "@/lib/constants/roles"

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Members", href: "/members" },
  { label: "Classes", href: "/classes" },
  { label: "Sessions", href: "/sessions" },
]

interface SidebarProps {
  academyName: string
  memberName: string
  memberRole: Role
}

export function Sidebar({ academyName, memberName, memberRole }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-semibold text-gray-900">{academyName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="truncate text-sm font-medium text-gray-900">{memberName}</p>
        <p className="text-xs text-gray-500">{ROLE_LABELS[memberRole]}</p>
      </div>
    </aside>
  )
}
