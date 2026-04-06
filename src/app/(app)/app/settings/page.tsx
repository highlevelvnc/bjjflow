import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { SettingsForm } from "./SettingsForm"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const trpc = await createServerCaller()
  const academy = await trpc.academy.getCurrent()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your academy configuration.</p>
      </div>

      <SettingsForm
        initialData={{
          name: academy.name,
          timezone: academy.timezone,
          allow_student_self_checkin: academy.allow_student_self_checkin,
          allow_student_portal: academy.allow_student_portal,
        }}
      />
    </div>
  )
}
