"use client"
import { useState, useEffect } from "react"
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"

const STEPS = [
  { title: "Bem-vindo ao Kumo!", desc: "Vamos fazer um tour rápido pela sua plataforma de gestão de academia.", target: null },
  { title: "Painel", desc: "Seu centro de comando — estatísticas, próximas aulas, alunos em risco e avisos.", target: null },
  { title: "Alunos", desc: "Adicione alunos e instrutores. Importação em massa via CSV. Acompanhe faixas e frequência.", target: null },
  { title: "Turmas & Aulas", desc: "Crie modelos de turmas, gere aulas semanais e controle a frequência.", target: null },
  { title: "Check-in", desc: "Alunos fazem check-in via QR code. Ou marque a presença manualmente.", target: null },
  { title: "Mensalidades", desc: "Crie planos, gere cobranças PIX, veja quem pagou e quem está em atraso.", target: null },
  { title: "Tudo pronto!", desc: "Comece adicionando seus alunos e criando as turmas. Oss! 🤙", target: null },
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
            <span className="text-xs text-gray-500">Passo {step + 1} de {STEPS.length}</span>
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
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          ) : <div />}
          {isLast ? (
            <button onClick={finish} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
              Vamos lá!
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
              Próximo <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
