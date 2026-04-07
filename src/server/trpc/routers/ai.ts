import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import {
  BJJ_TECHNIQUES,
  CATEGORY_META,
  SEARCH_SUGGESTIONS,
  getDailyTechnique,
  getTechniqueById,
  searchTechniques,
  type TechniqueCategory,
} from "@/lib/bjj/techniques"

/**
 * Coach Kumo router — alimenta o explorador de técnicas do aluno.
 *
 * 100% local: nenhuma chamada externa, nenhuma chave de API.
 * Toda a curadoria de Jiu-Jitsu Brasileiro está em `src/lib/bjj/techniques.ts`.
 */

const CATEGORY_ENUM = z.enum([
  "guarda",
  "raspagem",
  "passagem",
  "finalizacao",
  "escape",
  "fundamento",
])

export const aiRouter = router({
  /** Lista completa do banco de técnicas — payload pequeno (~30 itens). */
  library: protectedProcedure.query(() => {
    return BJJ_TECHNIQUES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      position: t.position,
      belt: t.belt,
      difficulty: t.difficulty,
      summary: t.summary,
      tags: t.tags,
    }))
  }),

  /** Sugestões de buscas para o aluno começar. */
  suggestions: protectedProcedure.query(() => SEARCH_SUGGESTIONS),

  /** Categorias com metadados (label, descrição, tom de cor). */
  categories: protectedProcedure.query(() => {
    return (Object.keys(CATEGORY_META) as TechniqueCategory[]).map((id) => ({
      id,
      ...CATEGORY_META[id],
    }))
  }),

  /** Busca por relevância (nome, tags, posição, sumário, passos). */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().int().min(1).max(20).default(8),
      }),
    )
    .query(({ input }) => {
      const results = searchTechniques(input.query, { limit: input.limit })
      return results.map((r) => ({
        ...r.technique,
        score: r.score,
      }))
    }),

  /** Detalhe completo de uma técnica. */
  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      const technique = getTechniqueById(input.id)
      if (!technique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Técnica não encontrada.",
        })
      }
      return technique
    }),

  /** Filtra por categoria. */
  byCategory: protectedProcedure
    .input(z.object({ category: CATEGORY_ENUM }))
    .query(({ input }) => {
      return BJJ_TECHNIQUES.filter((t) => t.category === input.category)
    }),

  /**
   * Técnica do dia — determinística por aluno + dia.
   * O mesmo aluno vê a mesma técnica o dia todo, mas muda no dia seguinte.
   */
  daily: protectedProcedure.query(({ ctx }) => {
    const seed = ctx.member?.id ?? "anonymous"
    return getDailyTechnique(seed)
  }),
})
