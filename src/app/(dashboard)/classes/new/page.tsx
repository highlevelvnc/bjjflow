import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { CreateClassForm } from "@/components/classes/CreateClassForm"

export const metadata: Metadata = {
  title: "New Class",
}

export default async function NewClassPage() {
  const trpc = await createServerCaller()

  // Fetch instructors and admins in parallel for the instructor selector
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
        <Link href="/classes" className="text-sm text-gray-500 hover:text-gray-700">
          ← Classes
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">New Class</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Create a class template. Generate sessions from it to schedule classes.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CreateClassForm instructors={instructors} />
      </div>
    </div>
  )
}
