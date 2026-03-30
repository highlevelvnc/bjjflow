import "server-only"
import { TRPCError } from "@trpc/server"
import { procedure, middleware } from "./init"

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enforces that the caller has a valid Supabase session.
 * Narrows context: userId is guaranteed non-null downstream.
 */
const enforceAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId },
  })
})

/**
 * Enforces that the caller has an active membership in the current academy.
 *
 * Requires:
 *   - Valid session (userId non-null)
 *   - app_metadata.academy_id set in JWT
 *   - Matching active member row (status = 'active')
 *
 * Narrows context: member and academyId are guaranteed non-null downstream.
 */
const enforceAcademyMember = middleware(({ ctx, next }) => {
  if (!ctx.member || !ctx.academyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Active academy membership required.",
    })
  }
  return next({
    ctx: { ...ctx, member: ctx.member, academyId: ctx.academyId },
  })
})

/**
 * Enforces that the caller is an instructor or admin.
 * Must be composed after enforceAcademyMember.
 */
const enforceInstructor = middleware(({ ctx, next }) => {
  if (!ctx.member || !["admin", "instructor"].includes(ctx.member.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Instructor access required.",
    })
  }
  return next({ ctx })
})

/**
 * Enforces that the caller is an admin.
 * Must be composed after enforceAcademyMember.
 */
const enforceAdmin = middleware(({ ctx, next }) => {
  if (!ctx.member || ctx.member.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required.",
    })
  }
  return next({ ctx })
})

// ─────────────────────────────────────────────────────────────────────────────
// Exported procedures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * No authentication required.
 * Use for: health checks, public data, slug resolution proxy.
 */
export const publicProcedure = procedure

/**
 * Requires a valid session + active academy membership.
 *
 * This is the base procedure for all dashboard operations.
 * All three roles (admin, instructor, student) pass this check.
 */
export const protectedProcedure = procedure
  .use(enforceAuthenticated)
  .use(enforceAcademyMember)

/**
 * Requires active academy membership AND role = instructor OR admin.
 *
 * Use for: attendance marking, session management, technique CRUD.
 */
export const instructorProcedure = protectedProcedure.use(enforceInstructor)

/**
 * Requires active academy membership AND role = admin.
 *
 * Use for: billing reads, member management, settings, audit log, automations.
 */
export const adminProcedure = protectedProcedure.use(enforceAdmin)
