import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { CreateClassForm } from "@/components/classes/CreateClassForm"

export const metadata: Metadata = {
  title: "New Class",
}

export default async function NewClassPage() {
  const trpc = await createServerCaller()

  const [instructorMembers, adminMembers] = await Promise.all([
    trpc.member.list({ role: "instructor" }),
    trpc.member.list({ role: "admin" }),
  ])

  const instructors = [
    ...adminMembers.map((m) => ({ id: m.id, full_name: m.full_name })),
    ...instructorMembers.map((m) => ({ id: m.id, full_name: m.full_name })),
  ]

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/app/classes" className="text-sm text-gray-500 hover:text-gray-300">
          ← Classes
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-100">New Class</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Create a class template. Generate sessions from it to schedule classes.
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <CreateClassForm instructors={instructors} />
      </div>
    </div>
  )
}
