"use client"

import { useState } from "react"
import {
  Calendar,
  LogOut,
  Mail,
  Shield,
  Loader2,
  User as UserIcon,
  BookOpen,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { BeltBadge } from "@/components/aluno/BeltBadge"
import { BeltJourney } from "@/components/portal/BeltJourney"
import { createClient } from "@/lib/supabase/client"

export function ProfileSection() {
  const profile = trpc.portal.myProfile.useQuery()
  const stats = trpc.portal.myStats.useQuery()
  const beltHistory = trpc.portal.myBeltHistory.useQuery()

  const [signingOut, setSigningOut] = useState(false)
  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch {
      setSigningOut(false)
    }
  }

  if (profile.isLoading || !profile.data) {
    return (
      <div className="flex justify-center py-10 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  const m = profile.data
  const initial = m.full_name.charAt(0).toUpperCase()
  const memberSince = new Date(m.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-5">
      {/* ── Identity card ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-brand-500/10 via-gray-900 to-gray-950 p-5 shadow-xl shadow-black/20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div className="relative flex items-center gap-4">
          {m.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.avatar_url}
              alt={m.full_name}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-brand-500/40"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-3xl font-bold text-white shadow-lg shadow-brand-500/30">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-gray-100">
              {m.full_name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-400">
              <Mail className="h-3 w-3" />
              {m.email}
            </p>
            <div className="mt-2">
              <BeltBadge belt={m.belt_rank} stripes={m.stripes} compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick stats ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2">
        <StatCard
          label="Treinos totais"
          value={stats.data?.totalAttendance ?? 0}
        />
        <StatCard
          label="Últimos 30d"
          value={stats.data?.last30Days ?? 0}
        />
        <StatCard
          label="Presença"
          value={`${stats.data?.attendanceRate30 ?? 0}%`}
        />
      </section>

      {/* ── Belt journey (existing component) ───────────────────────────── */}
      <BeltJourney
        currentBelt={m.belt_rank}
        currentStripes={m.stripes}
        memberSince={m.created_at}
        memberId={m.id}
        beltHistory={beltHistory.data ?? []}
      />

      {/* ── Account info ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-gray-900/60 p-4 backdrop-blur">
        <h3 className="mb-3 text-sm font-semibold text-gray-200">Conta</h3>
        <ul className="divide-y divide-white/5">
          <InfoRow icon={UserIcon} label="Função" value={roleLabel(m.role)} />
          <InfoRow icon={Calendar} label="Aluno desde" value={memberSince} />
          <InfoRow icon={Shield} label="ID" value={shortId(m.id)} mono />
        </ul>
      </section>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <Link
          href="/aluno/aprender"
          className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-gray-900/60 px-4 py-3 text-sm text-gray-200 transition-colors hover:border-white/15 hover:bg-gray-900"
        >
          <span className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-brand-300" />
            Biblioteca de técnicas
          </span>
          <span className="text-xs text-gray-500">→</span>
        </Link>
        <Link
          href="/aluno/performance"
          className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-gray-900/60 px-4 py-3 text-sm text-gray-200 transition-colors hover:border-white/15 hover:bg-gray-900"
        >
          <span className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-cyan-300" />
            Meu desempenho
          </span>
          <span className="text-xs text-gray-500">→</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-60"
        >
          <span className="flex items-center gap-3">
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sair da conta
          </span>
        </button>
      </section>
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-3 text-center backdrop-blur">
      <p className="text-xl font-bold text-gray-100">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span
        className={`text-xs text-gray-200 ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </li>
  )
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    student: "Aluno",
    instructor: "Professor",
    owner: "Diretor",
    admin: "Administração",
  }
  return map[role] ?? role
}

function shortId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}
