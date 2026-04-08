import "server-only"
import { z } from "zod"
import { router } from "../init"
import { instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { TRPCError } from "@trpc/server"

export const inventoryRouter = router({
  /**
   * List all inventory items with low stock warning. Paginated.
   */
  listItems: instructorProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      const { data, count } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: false })
        .eq("academy_id", ctx.academyId!)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1)

      const items = (data ?? []).map((item) => ({
        ...item,
        is_low_stock: item.stock_quantity <= item.low_stock_threshold,
      }))

      return { items, total: count ?? 0 }
    }),

  /**
   * Get a single item with recent transactions.
   */
  getItem: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data: item } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." })
      }

      const { data: transactions } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("item_id", input.id)
        .eq("academy_id", ctx.academyId!)
        .order("created_at", { ascending: false })
        .limit(20)

      return { ...item, transactions: transactions ?? [] }
    }),

  /**
   * Create a new inventory item. Admin only.
   */
  createItem: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).nullable().optional(),
        category: z
          .enum(["kimono", "belt", "rashguard", "shorts", "accessory", "other"])
          .default("other"),
        price_cents: z.number().int().min(0),
        // BRL is the only currency this product supports right now — the
        // app is PT-BR first and the inventory form's price label is
        // hardcoded "Preço (R$)". The schema column already defaults to
        // 'BRL' at the database level; this default just keeps server
        // and DB in sync. (Was `'USD'` before, which is why every item
        // created so far ended up flagged as dollars in the list view.)
        currency: z.string().max(3).default("BRL"),
        stock_quantity: z.number().int().min(0).default(0),
        low_stock_threshold: z.number().int().min(0).default(5),
        sku: z.string().max(100).nullable().optional(),
        image_url: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          academy_id: ctx.academyId!,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          price_cents: input.price_cents,
          currency: input.currency,
          stock_quantity: input.stock_quantity,
          low_stock_threshold: input.low_stock_threshold,
          sku: input.sku ?? null,
          image_url: input.image_url ?? null,
        })
        .select("id, name")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Update an inventory item. Admin only.
   */
  updateItem: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).nullable().optional(),
        category: z
          .enum(["kimono", "belt", "rashguard", "shorts", "accessory", "other"])
          .optional(),
        price_cents: z.number().int().min(0).optional(),
        currency: z.string().max(3).optional(),
        stock_quantity: z.number().int().min(0).optional(),
        low_stock_threshold: z.number().int().min(0).optional(),
        sku: z.string().max(100).nullable().optional(),
        image_url: z.string().url().nullable().optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { id, ...updates } = input

      const { data, error } = await supabase
        .from("inventory_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("academy_id", ctx.academyId!)
        .select("id, name")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Record a transaction (sale, restock, adjustment, return).
   * Also updates stock_quantity on the item.
   */
  recordTransaction: instructorProcedure
    .input(
      z.object({
        item_id: z.string().uuid(),
        type: z.enum(["sale", "restock", "adjustment", "return"]),
        quantity: z.number().int().min(1),
        member_id: z.string().uuid().nullable().optional(),
        price_cents: z.number().int().nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Get current stock
      const { data: item } = await supabase
        .from("inventory_items")
        .select("id, stock_quantity")
        .eq("id", input.item_id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." })
      }

      // Calculate new stock
      let delta = input.quantity
      if (input.type === "sale") delta = -input.quantity
      if (input.type === "adjustment") delta = input.quantity // can be positive adjustment
      if (input.type === "return") delta = input.quantity

      const newStock = Math.max(0, item.stock_quantity + delta)

      // Insert transaction
      const { error: txError } = await supabase.from("inventory_transactions").insert({
        academy_id: ctx.academyId!,
        item_id: input.item_id,
        type: input.type,
        quantity: input.quantity,
        member_id: input.member_id ?? null,
        price_cents: input.price_cents ?? null,
        notes: input.notes ?? null,
        created_by: ctx.member!.id,
      })

      if (txError) throw txError

      // Update stock quantity
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq("id", input.item_id)
        .eq("academy_id", ctx.academyId!)

      if (updateError) throw updateError

      return { newStock }
    }),

  /**
   * Return items where stock_quantity <= low_stock_threshold.
   */
  getLowStock: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // Supabase doesn't support column-to-column comparison in .filter(),
    // so we fetch all active items and filter in JS.
    const { data } = await supabase
      .from("inventory_items")
      .select("id, name, category, stock_quantity, low_stock_threshold, price_cents, currency")
      .eq("academy_id", ctx.academyId!)
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true })

    return (data ?? []).filter((item) => item.stock_quantity <= item.low_stock_threshold)
  }),
})
