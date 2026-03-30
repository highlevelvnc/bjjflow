import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names with clsx + tailwind-merge.
 * Resolves conflicts (e.g. p-4 + p-2 → p-2).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
