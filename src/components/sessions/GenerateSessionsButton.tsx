"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

interface GenerateSessionsButtonProps {
  classId: string
}

export function GenerateSessionsButton({ classId }: GenerateSessionsButtonProps) {
  const router = useRouter()
  const [result, setResult] = useState<string | null>(null)

  const generate = trpc.session.generateUpcoming.useMutation({
    onSuccess: (data) => {
      setResult(`${data.created} session${data.created !== 1 ? "s" : ""} created`)
      router.refresh()
      setTimeout(() => setResult(null), 4000)
    },
  })

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => generate.mutate({ classId, weeksAhead: 4 })}
        disabled={generate.isPending}
        className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        {generate.isPending ? "Generating…" : "Generate 4 weeks"}
      </button>
      {result && <span className="text-xs text-green-600">{result}</span>}
      {generate.error && (
        <span className="text-xs text-red-500">{generate.error.message}</span>
      )}
    </div>
  )
}
