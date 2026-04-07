/**
 * Tiny zero-dep confetti.
 *
 * No `canvas-confetti` or any other npm package — just a few hundred lines of
 * DOM nodes that animate via the Web Animations API and clean themselves up.
 * Used for level-up + achievement unlock celebrations in the student app.
 *
 * Why not pull `canvas-confetti`? It's ~7KB and adds a runtime dep. We only
 * need ~12 particles — plain DOM is plenty and looks great.
 */

export interface ConfettiOptions {
  /** DOM element to spawn the burst from. Defaults to viewport center. */
  origin?: HTMLElement | null
  /** Number of particles. Default 28. */
  count?: number
  /** Duration of each particle in ms. Default 1300. */
  duration?: number
}

const PALETTE = [
  "#22d3ee", // cyan
  "#a855f7", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#ec4899", // pink
  "#f5f5f5", // white
]

export function fireConfetti(options: ConfettiOptions = {}) {
  if (typeof window === "undefined") return
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

  const count = options.count ?? 28
  const duration = options.duration ?? 1300

  // Compute origin point
  let originX = window.innerWidth / 2
  let originY = window.innerHeight / 3
  if (options.origin) {
    const rect = options.origin.getBoundingClientRect()
    originX = rect.left + rect.width / 2
    originY = rect.top + rect.height / 2
  }

  // Container we can wipe in one go
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "0"
  container.style.top = "0"
  container.style.pointerEvents = "none"
  container.style.zIndex = "9999"
  container.style.width = "100vw"
  container.style.height = "100vh"
  document.body.appendChild(container)

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span")
    const size = 6 + Math.random() * 6
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]!
    const isSquare = Math.random() > 0.5

    particle.style.position = "absolute"
    particle.style.left = `${originX}px`
    particle.style.top = `${originY}px`
    particle.style.width = `${size}px`
    particle.style.height = `${size * (isSquare ? 1 : 1.6)}px`
    particle.style.backgroundColor = color
    particle.style.borderRadius = isSquare ? "1px" : "9999px"
    particle.style.opacity = "1"
    particle.style.willChange = "transform, opacity"
    container.appendChild(particle)

    // Random launch direction (full 360°, biased upward)
    const angle = Math.random() * Math.PI * 2 - Math.PI / 2
    const velocity = 90 + Math.random() * 160
    const dx = Math.cos(angle) * velocity
    const dy = Math.sin(angle) * velocity - 80 // extra upward kick
    const rotate = Math.random() * 720 - 360

    particle.animate(
      [
        {
          transform: "translate(-50%, -50%) rotate(0deg)",
          opacity: 1,
        },
        {
          transform: `translate(${dx}px, ${dy + 40}px) rotate(${rotate / 2}deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(${dx * 1.2}px, ${dy + 240}px) rotate(${rotate}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.2, 0.7, 0.4, 1)",
        fill: "forwards",
      },
    )
  }

  // Clean up after the animation finishes
  window.setTimeout(() => {
    container.remove()
  }, duration + 200)
}
