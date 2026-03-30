"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

export function InviteForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createInvite = trpc.invite.create.useMutation({
    onSuccess: (data) => {
      setSuccess(
        `Invite created for ${data.email}. Token: ${data.token}`,
      )
      setEmail("")
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    createInvite.mutate({ email: email.trim(), role: "instructor" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 break-all">
          {success}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Email address<span className="ml-0.5 text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="instructor@example.com"
          required
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <p className="text-sm text-gray-500">Instructor (only role available via invite)</p>
      </div>

      <button
        type="submit"
        disabled={createInvite.isPending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {createInvite.isPending ? "Creating..." : "Create Invite"}
      </button>
    </form>
  )
}
