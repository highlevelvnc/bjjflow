import type { Metadata } from "next"
import { ProfileSection } from "./ProfileSection"

export const metadata: Metadata = { title: "Perfil" }

export default function AlunoPerfilPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
          Sua conta
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100">
          Perfil do aluno
        </h1>
      </header>
      <ProfileSection />
    </div>
  )
}
