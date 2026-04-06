"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/app/analytics", label: "Overview" },
  { href: "/app/analytics/finance", label: "Financial" },
  { href: "/app/analytics/benchmark", label: "Benchmark" },
] as const

export function AnalyticsNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 mb-6">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/app/analytics"
            ? pathname === "/app/analytics"
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
