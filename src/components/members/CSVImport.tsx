"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

interface CSVRow {
  full_name: string
  email?: string
  role: "student" | "instructor"
  belt_rank: string
  stripes: number
  phone?: string
}

const VALID_BELTS = ["white", "blue", "purple", "brown", "black", "coral", "red_black", "red_white", "red"]
const VALID_ROLES = ["student", "instructor"]

function parseCSV(text: string): { rows: CSVRow[]; errors: string[] } {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] }

  const header = lines[0]!.toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""))
  const nameIdx = header.findIndex((h) => h === "name" || h === "full_name" || h === "nome")
  const emailIdx = header.findIndex((h) => h === "email" || h === "e-mail")
  const roleIdx = header.findIndex((h) => h === "role" || h === "tipo" || h === "function")
  const beltIdx = header.findIndex((h) => h === "belt" || h === "belt_rank" || h === "faixa")
  const stripesIdx = header.findIndex((h) => h === "stripes" || h === "graus")
  const phoneIdx = header.findIndex((h) => h === "phone" || h === "telefone" || h === "tel")

  if (nameIdx === -1) return { rows: [], errors: ["CSV must have a 'name' or 'full_name' column"] }

  const rows: CSVRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    const name = cols[nameIdx]?.trim()
    if (!name || name.length < 2) {
      errors.push(`Row ${i + 1}: Missing or too short name`)
      continue
    }

    const role = roleIdx >= 0 ? cols[roleIdx]?.toLowerCase().trim() : "student"
    if (role && !VALID_ROLES.includes(role)) {
      errors.push(`Row ${i + 1}: Invalid role "${role}" — use student or instructor`)
      continue
    }

    const belt = beltIdx >= 0 ? cols[beltIdx]?.toLowerCase().trim() : "white"
    if (belt && !VALID_BELTS.includes(belt)) {
      errors.push(`Row ${i + 1}: Invalid belt "${belt}"`)
      continue
    }

    const stripesStr = stripesIdx >= 0 ? cols[stripesIdx]?.trim() : "0"
    const stripes = parseInt(stripesStr || "0", 10)
    if (isNaN(stripes) || stripes < 0 || stripes > 4) {
      errors.push(`Row ${i + 1}: Stripes must be 0-4`)
      continue
    }

    rows.push({
      full_name: name,
      email: emailIdx >= 0 ? cols[emailIdx]?.trim() || undefined : undefined,
      role: (role as "student" | "instructor") || "student",
      belt_rank: belt || "white",
      stripes,
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || undefined : undefined,
    })
  }

  return { rows, errors }
}

export function CSVImport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [_isPending, startTransition] = useTransition()

  const [parsed, setParsed] = useState<{ rows: CSVRow[]; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  const createMember = trpc.member.createManaged.useMutation()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setParsed(parseCSV(text))
      setResults(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return
    setImporting(true)
    let success = 0
    let failed = 0

    for (const row of parsed.rows) {
      try {
        await createMember.mutateAsync({
          full_name: row.full_name,
          email: row.email || "",
          role: row.role,
          belt_rank: row.belt_rank as "white" | "blue" | "purple" | "brown" | "black" | "coral" | "red_black" | "red_white" | "red",
          stripes: row.stripes,
          phone: row.phone || "",
        })
        success++
      } catch {
        failed++
      }
    }

    setResults({ success, failed })
    setImporting(false)
    if (success > 0) {
      startTransition(() => router.refresh())
    }
  }

  function reset() {
    setParsed(null)
    setResults(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!parsed && (
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/12 bg-white/3 px-6 py-8 transition-colors hover:border-brand-500/30 hover:bg-white/5">
          <Upload className="h-8 w-8 text-gray-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Upload CSV file</p>
            <p className="mt-1 text-xs text-gray-500">
              Columns: name (required), email, role, belt, stripes, phone
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      )}

      {/* Parse results */}
      {parsed && !results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-400" />
              <span className="text-sm font-medium text-gray-200">
                {parsed.rows.length} members ready to import
              </span>
            </div>
            <button onClick={reset} className="text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {parsed.errors.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                <AlertCircle className="h-4 w-4" />
                {parsed.errors.length} row(s) skipped
              </div>
              <ul className="mt-2 space-y-1 text-xs text-red-400/80">
                {parsed.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {parsed.errors.length > 5 && (
                  <li>...and {parsed.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {parsed.rows.length > 0 && (
            <>
              <div className="max-h-48 overflow-auto rounded-lg border border-white/8 bg-gray-900">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800/50 text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Belt</th>
                      <th className="px-3 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {parsed.rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="text-gray-300">
                        <td className="px-3 py-1.5">{r.full_name}</td>
                        <td className="px-3 py-1.5 capitalize">{r.role}</td>
                        <td className="px-3 py-1.5 capitalize">{r.belt_rank} {r.stripes > 0 && `(${r.stripes})`}</td>
                        <td className="px-3 py-1.5 text-gray-500">{r.email || "—"}</td>
                      </tr>
                    ))}
                    {parsed.rows.length > 10 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-center text-gray-500">
                          ...and {parsed.rows.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? `Importing... (${parsed.rows.length} members)` : `Import ${parsed.rows.length} members`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-400">
              {results.success} member(s) imported successfully
              {results.failed > 0 && ` · ${results.failed} failed`}
            </span>
          </div>
          <button
            onClick={reset}
            className="w-full rounded-xl border border-white/12 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/6"
          >
            Import more
          </button>
        </div>
      )}
    </div>
  )
}
