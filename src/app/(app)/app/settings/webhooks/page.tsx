import type { Metadata } from "next"
import { WebhooksClient } from "./WebhooksClient"

export const metadata: Metadata = {
  title: "Webhooks",
}

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Webhooks</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Receive real-time notifications when events happen in your academy.
          Perfect for Zapier, Make, or n8n integrations.
        </p>
      </div>
      <WebhooksClient />
    </div>
  )
}
