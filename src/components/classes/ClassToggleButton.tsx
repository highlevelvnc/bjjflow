"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

interface ClassToggleButtonProps {
  classId: string
  isActive: boolean
}

export function ClassToggleButton({ classId, isActive }: ClassToggleButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const toggle = trpc.class.toggleActive.useMutation({
    onSuccess: () => {
      setError(null)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  return (
    <div className="flex flex-col items-end gap-0.5">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={() => toggle.mutate({ id: classId, is_active: !isActive })}
        disabled={toggle.isPending}
        className="text-sm text-gray-500 hover:text-gray-100 disabled:opacity-40"
      >
        {toggle.isPending ? "..." : isActive ? "Deactivate" : "Activate"}
      </button>
    </div>
  )
}
