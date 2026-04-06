"use client"
import { useState, useRef, useEffect, useTransition } from "react"
import { ChevronDown, Check } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { switchAcademy } from "@/app/(app)/app/actions"

export function AcademySwitcher({ currentName }: { currentName: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const { data: memberships } = trpc.academy.listMemberships.useQuery()

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const academies = (memberships ?? [])
    .map((m) => {
      const a = m.academies as unknown as { id: string; name: string; slug: string } | null
      return a ? { id: a.id, name: a.name, role: m.role } : null
    })
    .filter(Boolean) as { id: string; name: string; role: string }[]

  if (academies.length <= 1) return <p className="truncate text-sm font-semibold text-white">{currentName}</p>

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-1 truncate text-sm font-semibold text-white hover:text-brand-300">
        <span className="truncate">{currentName}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-white/10 bg-gray-900 py-1 shadow-xl">
          {academies.map((a) => (
            <button
              key={a.id}
              onClick={() => { startTransition(() => switchAcademy(a.id)); setOpen(false) }}
              disabled={isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              {a.name === currentName && <Check className="h-3.5 w-3.5 text-brand-400" />}
              <span className="truncate">{a.name}</span>
              <span className="ml-auto text-xs capitalize text-gray-600">{a.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
