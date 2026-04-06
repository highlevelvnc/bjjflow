"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { ArrowLeft, Loader2, Send, XCircle, Check } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  signed: "bg-green-500/15 text-green-400",
  expired: "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
}

export function ContractView({ contractId }: { contractId: string }) {
  const utils = trpc.useUtils()
  const { data: contract, isLoading } = trpc.contract.getById.useQuery({ id: contractId })

  const sendMutation = trpc.contract.send.useMutation({
    onSuccess: () => utils.contract.getById.invalidate({ id: contractId }),
  })
  const cancelMutation = trpc.contract.cancel.useMutation({
    onSuccess: () => utils.contract.getById.invalidate({ id: contractId }),
  })
  const signMutation = trpc.contract.sign.useMutation({
    onSuccess: () => utils.contract.getById.invalidate({ id: contractId }),
  })

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    return { canvas, ctx }
  }, [])

  useEffect(() => {
    const result = getCanvasContext()
    if (!result) return
    const { canvas, ctx } = result
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [contract, getCanvasContext])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0]!.clientX - rect.left,
        y: e.touches[0]!.clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const result = getCanvasContext()
    if (!result) return
    const pos = getPos(e)
    result.ctx.beginPath()
    result.ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    e.preventDefault()
    const result = getCanvasContext()
    if (!result) return
    const pos = getPos(e)
    result.ctx.lineTo(pos.x, pos.y)
    result.ctx.stroke()
    setHasSignature(true)
  }

  function endDraw() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    const result = getCanvasContext()
    if (!result) return
    const { canvas, ctx } = result
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  function handleSign() {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    const signatureData = canvas.toDataURL("image/png")
    signMutation.mutate({
      id: contractId,
      signatureData,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">Contract not found.</div>
    )
  }

  const showSignaturePad = contract.status === "sent"
  const showAdminActions = contract.status === "draft" || contract.status === "sent"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/contracts"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-100">{contract.title}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              For: {contract.member_name}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[contract.status] ?? STATUS_STYLES.draft}`}
        >
          {contract.status}
        </span>
      </div>

      {/* Admin actions */}
      {showAdminActions && (
        <div className="flex gap-2">
          {contract.status === "draft" && (
            <button
              onClick={() => sendMutation.mutate({ id: contractId })}
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send to Member
            </button>
          )}
          <button
            onClick={() => cancelMutation.mutate({ id: contractId })}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Cancel Contract
          </button>
        </div>
      )}

      {sendMutation.error && <p className="text-xs text-red-400">{sendMutation.error.message}</p>}
      {cancelMutation.error && <p className="text-xs text-red-400">{cancelMutation.error.message}</p>}

      {/* Contract content */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
          {contract.content}
        </pre>
      </div>

      {/* Signature section */}
      {contract.status === "signed" && contract.signature_data && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-medium text-green-300">Signed</h3>
            {contract.signed_at && (
              <span className="text-xs text-green-400/60">
                on {new Date(contract.signed_at).toLocaleString()}
              </span>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contract.signature_data}
            alt="Signature"
            className="h-24 rounded-lg border border-white/8 bg-white/5 p-2"
          />
        </div>
      )}

      {/* Signature pad for member to sign */}
      {showSignaturePad && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <h3 className="mb-3 text-sm font-medium text-blue-300">Sign this contract</h3>
          <p className="mb-4 text-xs text-gray-500">
            Draw your signature in the box below using your mouse or finger.
          </p>
          <div className="mb-3 overflow-hidden rounded-lg border border-white/12 bg-gray-950">
            <canvas
              ref={canvasRef}
              className="h-32 w-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={!hasSignature || signMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
            >
              {signMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Sign Contract
            </button>
          </div>
          {signMutation.error && (
            <p className="mt-2 text-xs text-red-400">{signMutation.error.message}</p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
        {contract.expires_at && (
          <span>Expires: {new Date(contract.expires_at).toLocaleDateString()}</span>
        )}
        {contract.signer_ip && <span>Signer IP: {contract.signer_ip}</span>}
      </div>
    </div>
  )
}
