"use client"

import { useState, useCallback } from "react"

type EmbedMethod = "iframe" | "script"
type EmbedTheme = "dark" | "light"

export function EmbedCode({ slug }: { slug: string }) {
  const [theme, setTheme] = useState<EmbedTheme>("dark")
  const [method, setMethod] = useState<EmbedMethod>("iframe")
  const [copied, setCopied] = useState(false)

  const baseUrl = "https://grapplingflow.com"
  const embedUrl = `${baseUrl}/embed?academy=${slug}&theme=${theme}`

  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border-radius: 12px; border: 1px solid ${theme === "light" ? "#e5e7eb" : "#333"};" title="Class Schedule"></iframe>`

  const scriptCode = `<script src="${baseUrl}/embed/widget.js" data-academy="${slug}" data-theme="${theme}"></script>`

  const currentCode = method === "iframe" ? iframeCode : scriptCode

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [currentCode])

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-100">Incorporar Widget de Agenda</h2>
      <p className="mt-1 text-sm text-gray-500">
        Adicione a agenda de aulas em qualquer site. Copie o código abaixo e cole no seu site.
      </p>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Method toggle */}
        <div className="flex rounded-lg border border-white/10 bg-white/4 p-0.5">
          <button
            type="button"
            onClick={() => setMethod("iframe")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              method === "iframe"
                ? "bg-brand-500 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            iFrame
          </button>
          <button
            type="button"
            onClick={() => setMethod("script")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              method === "script"
                ? "bg-brand-500 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            JavaScript
          </button>
        </div>

        {/* Theme toggle */}
        <div className="flex rounded-lg border border-white/10 bg-white/4 p-0.5">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Escuro
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              theme === "light"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Claro
          </button>
        </div>
      </div>

      {/* Code textarea */}
      <div className="mt-4">
        <div className="relative">
          <textarea
            readOnly
            value={currentCode}
            rows={method === "iframe" ? 4 : 2}
            className="w-full resize-none rounded-lg border border-white/10 bg-gray-950 px-4 py-3 font-mono text-xs text-gray-300 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 rounded-md border border-white/10 bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-gray-500">Pré-visualização</p>
        <div
          className="overflow-hidden rounded-xl border border-white/10"
          style={{ height: 400 }}
        >
          <iframe
            src={`/embed?academy=${slug}&theme=${theme}`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="Pré-visualização do Widget"
          />
        </div>
      </div>
    </div>
  )
}
