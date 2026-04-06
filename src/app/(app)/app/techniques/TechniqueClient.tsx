"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { BookOpen, Plus, Loader2, X } from "lucide-react"

const BELT_COLORS: Record<string, string> = {
  white: "bg-white/20 text-white",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  brown: "bg-amber-700/20 text-amber-500",
  black: "bg-gray-700/30 text-gray-200",
}

export function TechniqueClient() {
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, refetch } = trpc.technique.list.useQuery()
  const createMutation = trpc.technique.create.useMutation({
    onSuccess: () => {
      setShowForm(false)
      refetch()
    },
  })

  const [form, setForm] = useState({
    name: "",
    description: "",
    position: "",
    category: "",
    belt_level: "white",
    instructions: "",
    key_points: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const keyPointsArr = form.key_points
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      position: form.position,
      category: form.category,
      belt_level: form.belt_level,
      instructions: form.instructions || undefined,
      key_points: keyPointsArr.length > 0 ? keyPointsArr : undefined,
    })
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      position: "",
      category: "",
      belt_level: "white",
      instructions: "",
      key_points: "",
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Techniques</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `${data.total} technique${data.total === 1 ? "" : "s"}` : "Carregando..."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Add Technique
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-200">New Technique</h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                  placeholder="e.g. Armbar from Closed Guard"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Position *</label>
                <input
                  type="text"
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                  placeholder="e.g. Closed Guard"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Category *</label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                  placeholder="e.g. Submission"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Belt Level</label>
                <select
                  value={form.belt_level}
                  onChange={(e) => setForm({ ...form, belt_level: e.target.value })}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
                >
                  <option value="white">White</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="brown">Brown</option>
                  <option value="black">Black</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                rows={2}
                placeholder="Brief description of the technique..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Instructions</label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                rows={3}
                placeholder="Step-by-step instructions..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Key Points (one per line)
              </label>
              <textarea
                value={form.key_points}
                onChange={(e) => setForm({ ...form, key_points: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                rows={3}
                placeholder={"Control the posture first\nGrip the sleeve and collar\nHip escape to angle"}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Technique
              </button>
            </div>
            {createMutation.error && (
              <p className="text-xs text-red-400">{createMutation.error.message}</p>
            )}
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No techniques yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Add your first technique to start building your curriculum.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Belt Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {data.items.map((t) => {
                const beltClass = BELT_COLORS[t.belt_level] ?? BELT_COLORS.white
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-100">{t.name}</p>
                      {t.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                          {t.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{t.position}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{t.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${beltClass}`}
                      >
                        {t.belt_level}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
