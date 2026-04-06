import type { Role } from "@/types/auth"

export const ROLES = {
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
} as const satisfies Record<string, Role>

/** Ordered from lowest to highest privilege. */
export const ROLE_ORDER: Role[] = ["student", "instructor", "admin"]

/** Human-readable labels. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  instructor: "Instrutor",
  student: "Aluno",
}

/**
 * Returns true if memberRole meets or exceeds the requiredRole.
 *
 * @example
 *   meetsRole("admin", "instructor") // true
 *   meetsRole("student", "instructor") // false
 */
export function meetsRole(memberRole: Role, requiredRole: Role): boolean {
  return ROLE_ORDER.indexOf(memberRole) >= ROLE_ORDER.indexOf(requiredRole)
}
