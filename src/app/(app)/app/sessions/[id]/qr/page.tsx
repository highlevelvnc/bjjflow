import type { Metadata } from "next"
import Link from "next/link"
import QRCode from "qrcode"
import { createServerCaller } from "@/lib/trpc/server"

export const metadata: Metadata = {
  title: "Session QR Code",
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

export default async function SessionQRPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const trpc = await createServerCaller()
  const session = await trpc.session.getById({ id })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const checkinUrl = `${appUrl}/app/checkin?session=${session.id}`

  const svgString = await QRCode.toString(checkinUrl, { type: "svg", width: 400 })

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div className="text-left">
        <Link
          href={`/app/sessions/${id}/attendance`}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          &larr; Back to session
        </Link>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-8">
        <h1 className="text-lg font-semibold text-gray-100">
          {session.class?.name ?? "Session"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(session.date)}
        </p>
        <p className="text-sm text-gray-500">
          {formatTime(session.start_time)} &ndash; {formatTime(session.end_time)}
        </p>

        <div
          className="mx-auto my-6 flex items-center justify-center rounded-xl bg-white p-4"
          style={{ width: 432, height: 432 }}
          dangerouslySetInnerHTML={{ __html: svgString }}
        />

        <p className="text-lg font-medium text-gray-200">
          Scan to check in
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Point your phone camera at the QR code above
        </p>
      </div>
    </div>
  )
}
