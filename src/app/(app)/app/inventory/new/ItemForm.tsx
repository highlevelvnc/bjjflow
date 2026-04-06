"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "kimono", label: "Kimono" },
  { value: "belt", label: "Faixa" },
  { value: "rashguard", label: "Rashguard" },
  { value: "shorts", label: "Shorts" },
  { value: "accessory", label: "Acessório" },
  { value: "other", label: "Outro" },
] as const

export function ItemForm() {
  const router = useRouter()

  const createMutation = trpc.inventory.createItem.useMutation({
    onSuccess: () => {
      router.push("/app/inventory")
    },
  })

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "other" as "kimono" | "belt" | "rashguard" | "shorts" | "accessory" | "other",
    price: "",
    stock_quantity: "0",
    low_stock_threshold: "5",
    sku: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceFloat = parseFloat(form.price)
    if (isNaN(priceFloat) || priceFloat < 0) return

    createMutation.mutate({
      name: form.name,
      description: form.description || null,
      category: form.category,
      price_cents: Math.round(priceFloat * 100),
      stock_quantity: parseInt(form.stock_quantity) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      sku: form.sku || null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/inventory"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-100">Adicionar Item ao Estoque</h1>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nome *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                placeholder="e.g. White Kimono A3"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Categoria</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as typeof form.category,
                  })
                }
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Preço (R$) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Quantidade em Estoque</label>
              <input
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Limite de Estoque Baixo</label>
              <input
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
              rows={3}
              placeholder="Descrição opcional..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/app/inventory"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Adicionar Item
            </button>
          </div>

          {createMutation.error && (
            <p className="text-xs text-red-400">{createMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
