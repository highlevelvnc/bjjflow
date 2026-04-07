/**
 * Hardcoded set of MVP techniques for the student performance radar.
 * Slugs are stable internal identifiers; labels are displayed in PT-BR.
 *
 * Add new techniques by appending to this list — the radar adapts.
 */
export const MVP_TECHNIQUES = [
  { slug: "arm-triangle", label: "Triângulo de braço" },
  { slug: "rear-naked-choke", label: "Mata-leão" },
  { slug: "ezekiel", label: "Ezequiel" },
  { slug: "armbar", label: "Chave de braço" },
  { slug: "mounted-triangle", label: "Triângulo montado" },
  { slug: "kimura", label: "Kimura" },
] as const

export type TechniqueSlug = (typeof MVP_TECHNIQUES)[number]["slug"]

export function getTechniqueLabel(slug: string): string {
  return MVP_TECHNIQUES.find((t) => t.slug === slug)?.label ?? slug
}
