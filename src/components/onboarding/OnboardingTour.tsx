"use client"
import { useState, useEffect } from "react"
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"

const STEPS = [
  { title: "Welcome to GrapplingFlow!", desc: "Let's take a quick tour of your academy management platform.", target: null },
  { title: "Dashboard", desc: "Your command center — stats, upcoming sessions, at-risk students, and announcements.", target: null },
  { title: "Members", desc: "Add students and instructors. Bulk import via CSV. Track belts and attendance.", target: null },
  { title: "Classes & Sessions", desc: "Create class templates, generate weekly sessions, and track attendance.", target: null },
  { title: "Check In", desc: "Students can self-check-in via QR code. Or mark attendance manually.", target: null },
  { title: "Student Billing", desc: "Create plans, generate PIX payments, track who's paid and who's overdue.", target: null },
  { title: "You're all set!", desc: "Start by adding your first members and creating class templates. Oss! 🤙", target: null },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem("gf-tour-done")) setShow(true)
  }, [])

  if (!show) return null

  function finish() { setShow(false); localStorage.setItem("gf-tour-done", "1") }

  const s = STEPS[step]!
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-500/20 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-400" />
            <span className="text-xs text-gray-500">Step {step + 1} of {STEPS.length}</span>
          </div>
          <button onClick={finish} className="text-gray-500 hover:text-gray-300"><X className="h-4 w-4" /></button>
        </div>

        <h2 className="text-xl font-bold text-gray-100">{s.title}</h2>
        <p className="mt-2 text-sm text-gray-400">{s.desc}</p>

        {/* Progress dots */}
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!isFirst ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : <div />}
          {isLast ? (
            <button onClick={finish} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
              Let&apos;s go!
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
