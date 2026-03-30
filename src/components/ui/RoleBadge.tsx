import { cn } from "@/lib/utils/cn"
import type { Role } from "@/types/auth"
import { ROLE_LABELS } from "@/lib/constants/roles"

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-800",
  instructor: "bg-blue-100 text-blue-800",
  student: "bg-gray-100 text-gray-700",
}

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
