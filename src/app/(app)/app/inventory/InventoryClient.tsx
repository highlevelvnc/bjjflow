"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import {
  ShoppingBag,
  Plus,
  Loader2,
  AlertTriangle,
  Package,
  MinusCircle,
  PlusCircle,
  X,
} from "lucide-react"

// ─── Category badge styles ──────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  kimono: "bg-blue-500/15 text-blue-400",
  belt: "bg-purple-500/15 text-purple-400",
  rashguard: "bg-cyan-500/15 text-cyan-400",
  shorts: "bg-green-500/15 text-green-400",
  accessory: "bg-amber-500/15 text-amber-400",
  other: "bg-gray-500/15 text-gray-400",
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function stockColor(quantity: number, threshold: number) {
  if (quantity === 0) return "text-red-400"
  if (quantity <= threshold) return "text-amber-400"
  return "text-green-400"
}

function stockBg(quantity: number, threshold: number) {
  if (quantity === 0) return "bg-red-500/15"
  if (quantity <= threshold) return "bg-amber-500/15"
  return "bg-green-500/15"
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InventoryClient() {
  const [sellItemId, setSellItemId] = useState<string | null>(null)
  const [sellQty, setSellQty] = useState(1)

  const { data, isLoading, refetch } = trpc.inventory.listItems.useQuery()
  const lowStockQuery = trpc.inventory.getLowStock.useQuery()

  const recordTx = trpc.inventory.recordTransaction.useMutation({
    onSuccess: () => {
      setSellItemId(null)
      setSellQty(1)
      refetch()
      lowStockQuery.refetch()
    },
  })

  function handleRestock(itemId: string) {
    recordTx.mutate({ item_id: itemId, type: "restock", quantity: 1 })
  }

  function handleSell(itemId: string) {
    recordTx.mutate({ item_id: itemId, type: "sale", quantity: sellQty })
  }

  const lowStockItems = lowStockQuery.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Estoque</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `${data.total} ite${data.total === 1 ? "m" : "ns"}` : "Carregando..."}
          </p>
        </div>
        <Link
          href="/app/inventory/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Adicionar Item
        </Link>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">Alerta de Estoque Baixo</p>
            <p className="mt-0.5 text-xs text-amber-400/70">
              {lowStockItems.length} ite{lowStockItems.length > 1 ? "ns" : "m"} com estoque baixo:{" "}
              {lowStockItems.map((i) => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-10 text-center">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">Nenhum item no estoque</p>
          <p className="mt-1 text-xs text-gray-600">
            Adicione seu primeiro produto para começar a controlar o estoque.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/8 bg-gray-900 p-4"
            >
              {/* Item header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-100">{item.name}</h3>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.other}`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-100">
                  {formatPrice(item.price_cents, item.currency)}
                </p>
              </div>

              {/* Stock indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${stockBg(item.stock_quantity, item.low_stock_threshold)} ${stockColor(item.stock_quantity, item.low_stock_threshold)}`}
                >
                  <Package className="h-3 w-3" />
                  {item.stock_quantity} em estoque
                </div>
                {item.sku && (
                  <span className="text-[10px] text-gray-600">SKU: {item.sku}</span>
                )}
              </div>

              {/* Quick actions */}
              <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
                <button
                  onClick={() => handleRestock(item.id)}
                  disabled={recordTx.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <PlusCircle className="h-3 w-3 text-green-400" />
                  +1
                </button>

                {sellItemId === item.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={item.stock_quantity}
                      value={sellQty}
                      onChange={(e) => setSellQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-xs text-gray-100 outline-none focus:border-brand-500/50"
                    />
                    <button
                      onClick={() => handleSell(item.id)}
                      disabled={recordTx.isPending || item.stock_quantity === 0}
                      className="rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => {
                        setSellItemId(null)
                        setSellQty(1)
                      }}
                      className="text-gray-600 hover:text-gray-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSellItemId(item.id)
                      setSellQty(1)
                    }}
                    disabled={item.stock_quantity === 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <MinusCircle className="h-3 w-3 text-red-400" />
                    Vender
                  </button>
                )}
              </div>

              {recordTx.error && sellItemId === item.id && (
                <p className="mt-2 text-xs text-red-400">{recordTx.error.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
