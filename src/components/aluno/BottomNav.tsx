"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Activity, BookOpen, Megaphone, User } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils/cn"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  match: (pathname: string) => boolean
}

const ITEMS: NavItem[] = [
  {
    href: "/aluno",
    label: "Início",
    icon: Home,
    match: (p) => p === "/aluno",
  },
  {
    href: "/aluno/aprender",
    label: "Aprender",
    icon: BookOpen,
    match: (p) => p.startsWith("/aluno/aprender"),
  },
  {
    href: "/aluno/performance",
    label: "Treinos",
    icon: Activity,
    match: (p) => p.startsWith("/aluno/performance"),
  },
  {
    href: "/aluno/mural",
    label: "Mural",
    icon: Megaphone,
    match: (p) => p.startsWith("/aluno/mural") || p.startsWith("/aluno/conquistas"),
  },
  {
    href: "/aluno/perfil",
    label: "Perfil",
    icon: User,
    match: (p) => p.startsWith("/aluno/perfil"),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-gray-950/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Top gradient line */}
      <div
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />

      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {ITEMS.map((item) => {
          const isActive = item.match(pathname)
          const Icon = item.icon
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-brand-200" : "text-gray-500 hover:text-gray-200",
                )}
              >
                {isActive && (
                  <>
                    <motion.span
                      layoutId="bottomNavActive"
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    />
                    <motion.span
                      layoutId="bottomNavGlow"
                      aria-hidden
                      className="absolute inset-x-4 top-1 h-8 rounded-full bg-brand-500/10 blur-xl"
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </>
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 transition-all",
                    isActive && "scale-110 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]",
                  )}
                />
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
