"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

// ─────────────────────────────────────────────────────────────────────────────
// Event categories for grouped checkboxes
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  {
    label: "Members",
    events: [
      { value: "member.created", label: "Member created" },
      { value: "member.updated", label: "Member updated" },
      { value: "member.deactivated", label: "Member deactivated" },
    ],
  },
  {
    label: "Sessions",
    events: [
      { value: "session.created", label: "Session created" },
      { value: "session.completed", label: "Session completed" },
      { value: "session.cancelled", label: "Session cancelled" },
    ],
  },
  {
    label: "Attendance",
    events: [
      { value: "attendance.marked", label: "Attendance marked" },
      { value: "attendance.unmarked", label: "Attendance unmarked" },
    ],
  },
  {
    label: "Classes",
    events: [
      { value: "class.created", label: "Class created" },
      { value: "class.updated", label: "Class updated" },
    ],
  },
  {
    label: "Invites",
    events: [
      { value: "invite.created", label: "Invite created" },
      { value: "invite.accepted", label: "Invite accepted" },
    ],
  },
  {
    label: "Other",
    events: [
      { value: "contract.signed", label: "Contract signed" },
      { value: "event.created", label: "Event created" },
      { value: "announcement.created", label: "Announcement created" },
    ],
  },
] as const

const ALL_EVENTS = EVENT_CATEGORIES.flatMap((c) =>
  c.events.map((e) => e.value),
)

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type WebhookItem = {
  id: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  last_status_code: number | null
  failure_count: number
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function WebhooksClient() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [showDocs, setShowDocs] = useState(false)

  const utils = trpc.useUtils()
  const webhooksQuery = trpc.webhook.list.useQuery()
  const createMutation = trpc.webhook.create.useMutation({
    onSuccess: (data) => {
      setCreatedSecret(data.secret)
      setShowForm(false)
      utils.webhook.list.invalidate()
    },
  })
  const updateMutation = trpc.webhook.update.useMutation({
    onSuccess: () => {
      setEditingId(null)
      utils.webhook.list.invalidate()
    },
  })
  const deleteMutation = trpc.webhook.delete.useMutation({
    onSuccess: () => utils.webhook.list.invalidate(),
  })
  const testMutation = trpc.webhook.test.useMutation({
    onSuccess: () => utils.webhook.list.invalidate(),
  })

  const webhooks: WebhookItem[] = (webhooksQuery.data as WebhookItem[]) ?? []

  return (
    <div className="space-y-6">
      {/* Secret reveal banner */}
      {createdSecret && (
        <SecretBanner
          secret={createdSecret}
          copied={copiedSecret}
          onCopy={() => {
            navigator.clipboard.writeText(createdSecret)
            setCopiedSecret(true)
            setTimeout(() => setCopiedSecret(false), 2000)
          }}
          onDismiss={() => {
            setCreatedSecret(null)
            setCopiedSecret(false)
          }}
        />
      )}

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
          }}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          {showForm ? "Cancel" : "Add Webhook"}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <WebhookForm
          onSubmit={(url, events) =>
            createMutation.mutate({ url, events: events as never[] })
          }
          loading={createMutation.isPending}
        />
      )}

      {/* Webhook list */}
      {webhooks.length === 0 && !showForm ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-gray-500">
            No webhooks configured. Add one to start receiving event
            notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id}>
              {editingId === webhook.id ? (
                <WebhookForm
                  initialUrl={webhook.url}
                  initialEvents={webhook.events}
                  onSubmit={(url, events) =>
                    updateMutation.mutate({
                      id: webhook.id,
                      url,
                      events: events as never[],
                    })
                  }
                  onCancel={() => setEditingId(null)}
                  loading={updateMutation.isPending}
                  isEdit
                />
              ) : (
                <WebhookCard
                  webhook={webhook}
                  onTest={() => testMutation.mutate({ id: webhook.id })}
                  onEdit={() => {
                    setEditingId(webhook.id)
                    setShowForm(false)
                  }}
                  onToggle={() =>
                    updateMutation.mutate({
                      id: webhook.id,
                      is_active: !webhook.is_active,
                    })
                  }
                  onDelete={() => {
                    if (confirm("Delete this webhook? This cannot be undone.")) {
                      deleteMutation.mutate({ id: webhook.id })
                    }
                  }}
                  testing={
                    testMutation.isPending &&
                    testMutation.variables?.id === webhook.id
                  }
                  testResult={
                    testMutation.variables?.id === webhook.id &&
                    testMutation.data
                      ? testMutation.data
                      : null
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Documentation section */}
      <div className="border-t border-zinc-800 pt-6">
        <button
          onClick={() => setShowDocs(!showDocs)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showDocs ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Webhook Documentation
        </button>
        {showDocs && <WebhookDocs />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Secret banner
// ─────────────────────────────────────────────────────────────────────────────

function SecretBanner({
  secret,
  copied,
  onCopy,
  onDismiss,
}: {
  secret: string
  copied: boolean
  onCopy: () => void
  onDismiss: () => void
}) {
  return (
    <div className="rounded-lg border border-amber-600/30 bg-amber-950/30 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-amber-300">
            Signing Secret
          </h3>
          <p className="mt-0.5 text-xs text-amber-400/80">
            Copy this secret now. It will not be shown again.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-200 text-sm"
        >
          Dismiss
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-zinc-900 px-3 py-2 text-xs font-mono text-amber-200 break-all select-all">
          {secret}
        </code>
        <button
          onClick={onCopy}
          className="shrink-0 rounded bg-zinc-800 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-zinc-700 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook card
// ─────────────────────────────────────────────────────────────────────────────

function WebhookCard({
  webhook,
  onTest,
  onEdit,
  onToggle,
  onDelete,
  testing,
  testResult,
}: {
  webhook: WebhookItem
  onTest: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  testing: boolean
  testResult: { status: number; ok: boolean } | null
}) {
  const isFailing = webhook.failure_count > 0

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Status dot */}
            <span
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                !webhook.is_active
                  ? "bg-gray-500"
                  : isFailing
                    ? "bg-red-500"
                    : "bg-emerald-500"
              }`}
            />
            <span className="truncate text-sm font-medium text-gray-200">
              {webhook.url}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5">
              {webhook.events.length} event
              {webhook.events.length !== 1 ? "s" : ""}
            </span>
            {!webhook.is_active && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-gray-500">
                Inactive
              </span>
            )}
            {isFailing && webhook.is_active && (
              <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-red-400">
                {webhook.failure_count} failure
                {webhook.failure_count !== 1 ? "s" : ""}
              </span>
            )}
            {webhook.last_triggered_at && (
              <span>
                Last triggered{" "}
                {new Date(webhook.last_triggered_at).toLocaleDateString()}
              </span>
            )}
            {webhook.last_status_code !== null &&
              webhook.last_status_code > 0 && (
                <span>HTTP {webhook.last_status_code}</span>
              )}
          </div>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`rounded px-3 py-1.5 text-xs ${
            testResult.ok
              ? "bg-emerald-950/40 text-emerald-400"
              : "bg-red-950/40 text-red-400"
          }`}
        >
          Test {testResult.ok ? "succeeded" : "failed"} — HTTP{" "}
          {testResult.status || "timeout"}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onTest}
          disabled={testing}
          className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {testing ? "Sending..." : "Test"}
        </button>
        <button
          onClick={onEdit}
          className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-zinc-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onToggle}
          className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-zinc-700 transition-colors"
        >
          {webhook.is_active ? "Disable" : "Enable"}
        </button>
        <button
          onClick={onDelete}
          className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook form (create / edit)
// ─────────────────────────────────────────────────────────────────────────────

function WebhookForm({
  initialUrl = "",
  initialEvents = [],
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}: {
  initialUrl?: string
  initialEvents?: string[]
  onSubmit: (url: string, events: string[]) => void
  onCancel?: () => void
  loading?: boolean
  isEdit?: boolean
}) {
  const [url, setUrl] = useState(initialUrl)
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    new Set(initialEvents),
  )

  function toggleEvent(event: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(event)) {
        next.delete(event)
      } else {
        next.add(event)
      }
      return next
    })
  }

  function toggleCategory(events: readonly { value: string }[]) {
    const values = events.map((e) => e.value)
    const allSelected = values.every((v) => selectedEvents.has(v))
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      for (const v of values) {
        if (allSelected) {
          next.delete(v)
        } else {
          next.add(v)
        }
      }
      return next
    })
  }

  function selectAll() {
    if (selectedEvents.size === ALL_EVENTS.length) {
      setSelectedEvents(new Set())
    } else {
      setSelectedEvents(new Set(ALL_EVENTS))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url || selectedEvents.size === 0) return
    onSubmit(url, Array.from(selectedEvents))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4"
    >
      {/* URL input */}
      <div>
        <label
          htmlFor="webhook-url"
          className="block text-sm font-medium text-gray-300"
        >
          Endpoint URL
        </label>
        <input
          id="webhook-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhooks/grapplingflow"
          required
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Event checkboxes */}
      <div>
        <div className="flex items-center justify-between">
          <span className="block text-sm font-medium text-gray-300">
            Events
          </span>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            {selectedEvents.size === ALL_EVENTS.length
              ? "Deselect all"
              : "Select all"}
          </button>
        </div>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_CATEGORIES.map((category) => {
            const allSelected = category.events.every((e) =>
              selectedEvents.has(e.value),
            )
            return (
              <div
                key={category.label}
                className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => toggleCategory(category.events)}
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  {category.label}
                </label>
                <div className="mt-2 space-y-1.5">
                  {category.events.map((event) => (
                    <label
                      key={event.value}
                      className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      {event.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || !url || selectedEvents.size === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Webhook"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
        {!isEdit && selectedEvents.size === 0 && (
          <span className="text-xs text-gray-500">
            Select at least one event
          </span>
        )}
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Documentation section
// ─────────────────────────────────────────────────────────────────────────────

function WebhookDocs() {
  return (
    <div className="mt-4 space-y-6 text-sm text-gray-400">
      {/* Payload structure */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200">
          Payload Structure
        </h3>
        <p className="mt-1">
          Every webhook delivery is an HTTP POST with a JSON body:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-gray-300">
{`{
  "event": "member.created",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    ...
  },
  "timestamp": "2026-04-06T12:00:00.000Z",
  "webhook_id": "uuid"
}`}
        </pre>
      </div>

      {/* Headers */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200">Headers</h3>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li>
            <code className="text-xs text-indigo-300">Content-Type</code>:{" "}
            application/json
          </li>
          <li>
            <code className="text-xs text-indigo-300">
              X-GrapplingFlow-Signature
            </code>
            : sha256=HMAC_HEX
          </li>
          <li>
            <code className="text-xs text-indigo-300">
              X-GrapplingFlow-Event
            </code>
            : the event name (e.g. member.created)
          </li>
        </ul>
      </div>

      {/* Signature verification */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200">
          Signature Verification (Node.js)
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-gray-300">
{`const crypto = require("crypto");

function verifySignature(body, secret, signatureHeader) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  const received = signatureHeader.replace("sha256=", "");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  );
}

// In your webhook handler:
app.post("/webhooks/grapplingflow", (req, res) => {
  const rawBody = JSON.stringify(req.body);
  const sig = req.headers["x-grapplingflow-signature"];
  if (!verifySignature(rawBody, YOUR_SECRET, sig)) {
    return res.status(401).send("Invalid signature");
  }
  // Process event...
  res.status(200).send("OK");
});`}
        </pre>
      </div>

      {/* Available events */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200">
          Available Events
        </h3>
        <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {cat.label}
              </span>
              <ul className="mt-1 mb-3 space-y-0.5">
                {cat.events.map((e) => (
                  <li key={e.value}>
                    <code className="text-xs text-gray-300">{e.value}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Retry / failure policy */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200">
          Failure Policy
        </h3>
        <p className="mt-1">
          If your endpoint responds with a non-2xx status code, the failure
          counter increments. After 10 consecutive failures, the webhook is
          automatically disabled. Re-enable it from this page once the issue is
          resolved.
        </p>
      </div>
    </div>
  )
}
