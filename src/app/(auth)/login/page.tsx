import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Shield } from "lucide-react"
import { LoginForm } from "./LoginForm"
import { getLocale } from "@/lib/i18n"
import { getMessages } from "@/lib/i18n/messages"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getMessages(locale)
  return { title: `${t.login.cta} — Kumo` }
}

export default async function LoginPage() {
  const locale = await getLocale()
  const t = getMessages(locale)
  const l = t.login

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
          <Image src="/kumologo.png" alt="Kumo" width={32} height={32} className="rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{l.h1}</h1>
        <p className="mt-2 text-sm text-gray-500">{l.subtitle}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <Suspense>
          <LoginForm
            emailLabel={l.emailLabel}
            emailPlaceholder={l.emailPlaceholder}
            passwordLabel={l.passwordLabel}
            passwordPlaceholder={l.passwordPlaceholder}
            cta={l.cta}
            loading={l.loading}
            errorInvalid={l.errorInvalid}
          />
        </Suspense>
      </div>

      {/* Forgot password */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-brand-400 transition-colors hover:text-brand-300"
        >
          Esqueceu sua senha?
        </Link>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
        <Shield className="h-3.5 w-3.5" />
        {l.security}
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-600">
        {l.noAccount}{" "}
        <Link href="/signup" className="font-medium text-brand-400 transition-colors hover:text-brand-300">
          {l.signUp} →
        </Link>
      </p>
    </div>
  )
}
