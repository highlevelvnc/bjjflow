import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Shield } from "lucide-react"
import { SignupForm } from "./SignupForm"

export const metadata: Metadata = {
  title: "Criar Conta — Kumo",
}

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <Image src="/kumologo.png" alt="Kumo" width={32} height={32} className="rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Crie sua conta
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Comece a gerenciar sua academia em minutos
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
        <Shield className="h-3.5 w-3.5" />
        Criptografia TLS 256-bit
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-600">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-400 transition-colors hover:text-brand-300"
        >
          Entrar →
        </Link>
      </p>
    </div>
  )
}
