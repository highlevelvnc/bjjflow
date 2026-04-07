import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { SettingsForm } from "./SettingsForm"
import { EmbedCode } from "./EmbedCode"

export const metadata: Metadata = {
  title: "Configurações",
}

export default async function SettingsPage() {
  const trpc = await createServerCaller()
  const academy = await trpc.academy.getCurrent()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Configurações</h1>
        <p className="mt-0.5 text-sm text-gray-500">Gerencie as configurações da sua academia.</p>
      </div>

      <SettingsForm
        initialData={{
          name: academy.name,
          slug: academy.slug,
          timezone: academy.timezone,
          allow_student_self_checkin: academy.allow_student_self_checkin,
          allow_student_portal: academy.allow_student_portal,
          block_after_days_overdue: academy.block_after_days_overdue,
        }}
      />

      <EmbedCode slug={academy.slug} />

      {/* Integrations */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-100">Integrações</h2>
        <p className="mb-4 text-xs text-gray-500">
          Conecte sua academia a ferramentas externas e automações.
        </p>
        <Link
          href="/app/settings/webhooks"
          className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:bg-white/8"
        >
          <div>
            <p className="text-sm font-medium text-gray-200">Webhooks</p>
            <p className="text-xs text-gray-500">
              Receba notificações de eventos em tempo real via HTTP. Perfeito para Zapier, Make ou n8n.
            </p>
          </div>
          <svg
            className="h-5 w-5 shrink-0 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
