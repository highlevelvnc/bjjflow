"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { BeltBadge } from "./BeltBadge"

interface Props {
  name: string
  belt: string
  stripes: number
  academyName: string
  avatarUrl: string | null
}

export function AlunoHeader({ name, belt, stripes, academyName, avatarUrl }: Props) {
  const firstName = name.split(" ")[0] ?? "Aluno"
  const initial = name.charAt(0).toUpperCase()

  return (
    <header
      className="relative z-30 border-b border-white/6 bg-gray-950/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* High-tech bottom accent line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/aluno/perfil" className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-500/40"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md shadow-brand-500/30">
                {initial}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-gray-950 bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-gray-500">
              {academyName}
            </p>
            <p className="truncate text-sm font-semibold text-gray-100">
              Olá, {firstName}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <BeltBadge belt={belt} stripes={stripes} compact />
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/5 text-gray-300 transition-colors hover:border-white/15 hover:text-white"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
