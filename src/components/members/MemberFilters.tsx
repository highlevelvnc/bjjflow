"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Search } from "lucide-react"

const inputClass =
  "w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

export function MemberFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = searchParams.get("search") ?? ""
  const role = searchParams.get("role") ?? ""
  const status = searchParams.get("status") ?? ""

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          placeholder="Search by name or email..."
          defaultValue={search}
          onChange={(e) => updateParams("search", e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      <select
        value={role}
        onChange={(e) => updateParams("role", e.target.value)}
        className={`${inputClass} w-auto min-w-[140px]`}
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="instructor">Instructor</option>
        <option value="student">Student</option>
      </select>

      <select
        value={status}
        onChange={(e) => updateParams("status", e.target.value)}
        className={`${inputClass} w-auto min-w-[140px]`}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
  )
}
