import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerCaller } from "@/lib/trpc/server"
import { EditMemberForm } from "@/components/members/EditMemberForm"

export const metadata = { title: "Edit Member" }

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trpc = await createServerCaller()

  let member
  try {
    member = await trpc.member.getById({ id })
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          ← Back to members
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">Edit Member</h1>
        <p className="mt-1 text-sm text-gray-500">Update {member.full_name}&apos;s profile</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <EditMemberForm member={member} />
      </div>
    </div>
  )
}
