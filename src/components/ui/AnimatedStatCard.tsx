"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import Link from "next/link"

interface AnimatedStatCardProps {
  label: string
  value: number
  href: string
  icon?: React.ReactNode
  trend?: number
  color?: "brand" | "emerald" | "amber" | "cyan" | "rose"
}

const colorMap = {
  brand:   { bg: "bg-brand-500/10",   border: "border-brand-500/20",   text: "text-brand-400",   glow: "shadow-brand-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   glow: "shadow-amber-500/20" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400",    glow: "shadow-cyan-500/20" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    glow: "shadow-rose-500/20" },
}

function CountUp({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0, 0, 0.2, 1],
      delay: 0.15,
    })
    return controls.stop
  }, [value, motionValue])

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v)
    })
  }, [rounded])

  return <span ref={ref}>0</span>
}

export function AnimatedStatCard({ label, value, href, icon, trend, color = "brand" }: AnimatedStatCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={href}
        className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border ${c.border} bg-gray-900/80 p-5 shadow-lg ${c.glow} backdrop-blur-sm transition-all duration-200 hover:border-opacity-40 hover:shadow-xl`}
      >
        {/* Subtle gradient top bar */}
        <div className={`absolute inset-x-0 top-0 h-[2px] ${c.bg} opacity-60 transition-opacity group-hover:opacity-100`}
             style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />

        {/* Background glow on hover */}
        <div className={`absolute inset-0 ${c.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

        <div className="relative flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">{label}</p>
          {icon && (
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text} transition-transform group-hover:scale-110`}>
              {icon}
            </div>
          )}
        </div>

        <div className="relative">
          <p className={`text-3xl font-bold tabular-nums text-white`}>
            <CountUp value={value} />
          </p>
          {trend !== undefined && (
            <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
