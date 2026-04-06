"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import {
  MessageSquare,
  Plus,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"

// ─── Relative time formatting ────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ""
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`

  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ─── Priority styling ────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  important: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  normal: "",
}


// ─── Component ───────────────────────────────────────────────────────────────

export function AnnouncementsClient() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, refetch } = trpc.announcement.list.useQuery()

  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: () => {
      resetForm()
      refetch()
    },
  })

  const updateMutation = trpc.announcement.update.useMutation({
    onSuccess: () => {
      setEditingId(null)
      resetForm()
      refetch()
    },
  })

  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => refetch(),
  })

  const pinMutation = trpc.announcement.pin.useMutation({
    onSuccess: () => refetch(),
  })

  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal" as "normal" | "important" | "urgent",
    pinned: false,
  })

  function resetForm() {
    setForm({ title: "", content: "", priority: "normal", pinned: false })
    setShowForm(false)
    setEditingId(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: form.title,
        content: form.content,
        priority: form.priority,
        pinned: form.pinned,
      })
    } else {
      createMutation.mutate({
        title: form.title,
        content: form.content,
        priority: form.priority,
        pinned: form.pinned,
      })
    }
  }

  function startEdit(a: {
    id: string
    title: string
    content: string
    priority: "normal" | "important" | "urgent"
    pinned: boolean
  }) {
    setEditingId(a.id)
    setForm({ title: a.title, content: a.content, priority: a.priority, pinned: a.pinned })
    setShowForm(true)
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Announcements</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `${data.total} post${data.total === 1 ? "" : "s"}` : "Loading..."}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      {/* Inline create/edit form */}
      {showForm && (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-200">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Content *</label>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                rows={4}
                placeholder="What would you like to announce?"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Priority pills */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">Priority</label>
                <div className="flex gap-1">
                  {(["normal", "important", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        form.priority === p
                          ? p === "urgent"
                            ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                            : p === "important"
                              ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                              : "bg-white/10 text-gray-200 ring-1 ring-white/20"
                          : "bg-white/5 text-gray-500 hover:bg-white/8"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {/* Pin checkbox */}
              <label className="flex items-center gap-2 pt-4 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                <Pin className="h-3.5 w-3.5" />
                Pin to top
              </label>
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
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Post"}
              </button>
            </div>
            {(createMutation.error || updateMutation.error) && (
              <p className="text-xs text-red-400">
                {createMutation.error?.message ?? updateMutation.error?.message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No announcements yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Create your first announcement to share with the academy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((a) => {
            const isExpanded = expandedIds.has(a.id)
            const isLong = a.content.length > 200

            return (
              <div
                key={a.id}
                className="rounded-xl border border-white/8 bg-gray-900 px-5 py-4"
              >
                {/* Top row: pin + priority + meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <Pin className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                      )}
                      {a.priority !== "normal" && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_BADGE[a.priority]}`}
                        >
                          {a.priority === "urgent" && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {a.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-gray-100">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {a.author_name} &middot; {timeAgo(a.published_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => pinMutation.mutate({ id: a.id, pinned: !a.pinned })}
                      className="rounded-md p-1.5 text-gray-600 hover:bg-white/5 hover:text-gray-300"
                      title={a.pinned ? "Unpin" : "Pin"}
                    >
                      {a.pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(a)}
                      className="rounded-md p-1.5 text-gray-600 hover:bg-white/5 hover:text-gray-300"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this announcement?")) {
                          deleteMutation.mutate({ id: a.id })
                        }
                      }}
                      className="rounded-md p-1.5 text-gray-600 hover:bg-white/5 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-2">
                  <p
                    className={`whitespace-pre-wrap text-sm text-gray-300 ${
                      !isExpanded && isLong ? "line-clamp-3" : ""
                    }`}
                  >
                    {a.content}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggleExpanded(a.id)}
                      className="mt-1 inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
