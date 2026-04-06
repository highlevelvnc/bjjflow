"use client"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/providers/ThemeProvider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} className="shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
