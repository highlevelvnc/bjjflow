"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, ArrowLeft, Smartphone } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { generatePixPayload } from "@/lib/pix/generate"
import { cn } from "@/lib/utils/cn"

// ─── QR Code Component (client-side generation) ─────────────────────────────

function QrCodeImage({ data }: { data: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(data, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 400,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).then((url) => {
        if (!cancelled) setSrc(url)
      })
    })
    return () => {
      cancelled = true
    }
  }, [data])

  if (!src) {
    return (
      <div className="flex h-[300px] w-[300px] items-center justify-center rounded-2xl bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-500" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="PIX QR Code"
      className="h-[300px] w-[300px] rounded-2xl"
    />
  )
}

// ─── Format Currency ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: currency || "BRL",
  }).format(amount)
}

// ─── Main PIX Payment Component ─────────────────────────────────────────────

export function PixPayment({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [pixPayload, setPixPayload] = useState<string | null>(null)

  const utils = trpc.useUtils()

  // We need to fetch the specific payment — use listPayments with plan context
  // For simplicity, fetch all and find the one we need
  const allPayments = trpc.studentPlan.listPayments.useQuery({ limit: 100 })
  const payment = allPayments.data?.items.find((p) => p.id === paymentId)

  const recordPayment = trpc.studentPlan.recordPayment.useMutation({
    onSuccess: () => {
      utils.studentPlan.invalidate()
      router.push("/app/student-billing")
    },
  })

  // Read PIX settings from localStorage
  const pixKey = typeof window !== "undefined" ? localStorage.getItem("gf_pix_key") || "" : ""
  const pixKeyType = (typeof window !== "undefined" ? localStorage.getItem("gf_pix_key_type") || "cpf" : "cpf") as "cpf" | "cnpj" | "email" | "phone" | "random"
  const merchantCity = typeof window !== "undefined" ? localStorage.getItem("gf_merchant_city") || "Sao Paulo" : "Sao Paulo"
  const merchantName = typeof window !== "undefined" ? localStorage.getItem("gf_academy_name") || "Academia" : "Academia"

  // Generate PIX payload when payment data is available
  useEffect(() => {
    if (payment && pixKey) {
      const payload = generatePixPayload({
        pixKey,
        pixKeyType,
        merchantName,
        merchantCity,
        amount: payment.amount,
        txid: paymentId.slice(0, 25),
        description: "Mensalidade",
      })
      setPixPayload(payload)
    }
  }, [payment, pixKey, pixKeyType, merchantName, merchantCity, paymentId])

  async function handleCopy() {
    if (!pixPayload) return
    try {
      await navigator.clipboard.writeText(pixPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // noop
    }
  }

  function handleMarkPaid() {
    if (confirm("Confirm this payment has been received?")) {
      recordPayment.mutate({ paymentId })
    }
  }

  if (allPayments.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-brand-500" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-gray-500">Payment not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-brand-400 hover:text-brand-300"
        >
          Go back
        </button>
      </div>
    )
  }

  const member = payment.members as unknown as { full_name: string }
  const plan = payment.student_plans as unknown as { name: string }

  const isPaid = payment.status === "paid"

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </button>

      {/* Payment Info */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent p-6">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-gray-100">PIX Payment</h1>
          <p className="mt-1 text-sm text-gray-400">
            {member?.full_name ?? "Student"} &mdash; {plan?.name ?? "Plan"}
          </p>
        </div>

        {/* Amount */}
        <div className="mb-6 text-center">
          <p className="text-3xl font-bold text-gray-100">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Due: {new Date(payment.due_date).toLocaleDateString()}
          </p>
          {isPaid && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-sm font-medium text-emerald-400">
              <Check className="h-4 w-4" />
              Paid
              {payment.paid_at && (
                <span className="text-emerald-500/60">
                  &middot; {new Date(payment.paid_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* QR Code */}
        {!isPaid && (
          <>
            {!pixKey ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <p className="text-sm text-amber-300">
                  PIX key not configured. Go to Settings to add your PIX key.
                </p>
              </div>
            ) : pixPayload ? (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-white p-2 shadow-lg shadow-purple-500/10">
                    <QrCodeImage data={pixPayload} />
                  </div>
                </div>

                {/* Copy PIX Code */}
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                    copied
                      ? "bg-emerald-500/12 text-emerald-400"
                      : "bg-purple-500/12 text-purple-300 hover:bg-purple-500/20",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied! Paste in your bank app.
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy PIX Code (Copia e Cola)
                    </>
                  )}
                </button>

                {/* Instructions */}
                <div className="rounded-xl border border-white/8 bg-gray-900/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-400" />
                    <p className="text-sm font-medium text-gray-200">How to pay</p>
                  </div>
                  <ol className="space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/12 text-xs font-bold text-purple-400">
                        1
                      </span>
                      Open your bank app
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/12 text-xs font-bold text-purple-400">
                        2
                      </span>
                      Go to PIX &rarr; Scan QR Code or Paste Code
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/12 text-xs font-bold text-purple-400">
                        3
                      </span>
                      Confirm the payment in your app
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/12 text-xs font-bold text-purple-400">
                        4
                      </span>
                      Click &ldquo;Mark as Paid&rdquo; below after payment
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-purple-500" />
              </div>
            )}
          </>
        )}

        {/* Mark as Paid button */}
        {!isPaid && (
          <button
            onClick={handleMarkPaid}
            disabled={recordPayment.isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {recordPayment.isPending ? (
              "Processing..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Mark as Paid
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
