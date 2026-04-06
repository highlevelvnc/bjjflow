"use client"
import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem("gf-install-dismissed")) return
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); setShow(true) }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-brand-500/20 bg-gray-900 p-4 shadow-2xl md:left-auto md:right-4">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-100">Install GrapplingFlow</p>
          <p className="mt-0.5 text-xs text-gray-500">Quick access from your home screen</p>
          <button onClick={async () => { await deferredPrompt?.prompt(); setShow(false) }} className="mt-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-400">Install</button>
        </div>
        <button onClick={() => { setShow(false); localStorage.setItem("gf-install-dismissed", "1") }} className="text-gray-500 hover:text-gray-300"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
