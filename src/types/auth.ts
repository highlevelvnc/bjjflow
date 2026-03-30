import type { User } from "@supabase/supabase-js"
import type { Database } from "./database"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type AcademyRow = Database["public"]["Tables"]["academies"]["Row"]

// ─────────────────────────────────────────────────────────────────────────────
// JWT app_metadata shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The shape of `session.user.app_metadata`.
 * Set server-side only (Supabase Admin SDK) — never trusted from client input.
 *
 * academy_id is set when an admin creates their first academy (post-Stripe).
 * It is updated by the switchAcademy() server action for multi-academy users.
 */
export type AppMetadata = {
  academy_id?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Session context (passed through tRPC context)
// ─────────────────────────────────────────────────────────────────────────────

export type AuthUser = User & {
  app_metadata: AppMetadata
}

/**
 * The resolved member context for the currently authenticated user
 * in their active academy. Set in the tRPC context factory.
 *
 * Null when the user has no active academy (onboarding state).
 */
export type MemberContext = MemberRow

// ─────────────────────────────────────────────────────────────────────────────
// Role hierarchy
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "admin" | "instructor" | "student"

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  instructor: 2,
  student: 1,
}

export function hasRole(memberRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[memberRole] >= ROLE_HIERARCHY[requiredRole]
}

// ─────────────────────────────────────────────────────────────────────────────
// Academy context for client components (safe subset — no Stripe IDs)
// ─────────────────────────────────────────────────────────────────────────────

export type AcademyContext = Pick<
  AcademyRow,
  | "id"
  | "name"
  | "slug"
  | "logo_url"
  | "status"
  | "plan"
  | "timezone"
  | "currency"
  | "allow_student_self_checkin"
  | "allow_student_portal"
>
