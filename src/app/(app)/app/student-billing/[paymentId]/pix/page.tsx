import type { Metadata } from "next"
import { PixPayment } from "./PixPayment"

export const metadata: Metadata = {
  title: "PIX Payment",
}

export default async function PixPaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params

  return <PixPayment paymentId={paymentId} />
}
