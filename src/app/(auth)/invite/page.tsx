import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabase } from "@/server/supabase/server"

// Lazy admin client to avoid build-time env errors
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
import { AcceptInviteButton } from "./AcceptInviteButton"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Aceitar Convite — Kumo",
}

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white">Invalid Invite</h1>
          <p className="mt-2 text-sm text-gray-400">No invite token provided.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Look up the invite using admin client (bypasses RLS)
  const { data: invite, error } = await getAdmin()
    .from("invites")
    .select("id, academy_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token", token)
    .single()

  if (error || !invite) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white">Invite Not Found</h1>
          <p className="mt-2 text-sm text-gray-400">
            This invite link is invalid or has been removed.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Check invite status
  const isExpired = new Date(invite.expires_at) < new Date()
  const isAccepted = !!invite.accepted_at
  const isRevoked = !!invite.revoked_at

  if (isAccepted || isRevoked || isExpired) {
    const reason = isAccepted
      ? "This invite has already been accepted."
      : isRevoked
        ? "This invite has been revoked."
        : "This invite has expired."

    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white">Invite Unavailable</h1>
          <p className="mt-2 text-sm text-gray-400">{reason}</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is logged in
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch academy name separately
  const { data: academy } = await getAdmin()
    .from("academies")
    .select("name")
    .eq("id", invite.academy_id)
    .single()
  const academyName = academy?.name ?? "an academy"

  // Not logged in — show sign up / log in prompt
  if (!user) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
              <Image src="/kumologo.png" alt="Kumo" width={32} height={32} className="rounded-lg" />
            </div>
            <h1 className="text-xl font-bold text-white">You&apos;re Invited!</h1>
            <p className="mt-2 text-sm text-gray-400">
              You&apos;ve been invited to join <span className="font-medium text-gray-200">{academyName}</span> as{" "}
              <span className="font-medium text-brand-300">{invite.role}</span>.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-gray-500">
              Create an account or log in to accept this invite.
            </p>
            <Link
              href={`/signup?redirectTo=${encodeURIComponent(`/invite?token=${token}`)}`}
              className="block w-full rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-400"
            >
              Create Account
            </Link>
            <Link
              href={`/login?redirectTo=${encodeURIComponent(`/invite?token=${token}`)}`}
              className="block w-full rounded-lg border border-white/12 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition-colors hover:bg-white/6"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in — check email match
  const emailMatch = user.email?.toLowerCase() === invite.email.toLowerCase()

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30">
            <Image src="/kumologo.png" alt="Kumo" width={32} height={32} className="rounded-lg" />
          </div>
          <h1 className="text-xl font-bold text-white">Accept Invite</h1>
          <p className="mt-2 text-sm text-gray-400">
            Join <span className="font-medium text-gray-200">{academyName}</span> as{" "}
            <span className="font-medium text-brand-300">{invite.role}</span>.
          </p>
        </div>

        {!emailMatch ? (
          <div className="mt-6">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-300">
                This invite was sent to <span className="font-medium">{invite.email}</span>, but you
                are logged in as <span className="font-medium">{user.email}</span>.
              </p>
              <p className="mt-1 text-xs text-amber-400/70">
                Please log in with the correct email to accept this invite.
              </p>
            </div>
            <Link
              href={`/login?redirectTo=${encodeURIComponent(`/invite?token=${token}`)}`}
              className="mt-4 block w-full rounded-lg border border-white/12 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition-colors hover:bg-white/6"
            >
              Switch Account
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-lg border border-white/8 bg-white/4 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-200">{user.email}</p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
              </div>
            </div>

            <AcceptInviteButton token={token} />
          </div>
        )}
      </div>
    </div>
  )
}
