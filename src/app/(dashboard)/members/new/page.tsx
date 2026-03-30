import type { Metadata } from "next"
import Link from "next/link"
import { CreateManagedMemberForm } from "@/components/members/CreateManagedMemberForm"

export const metadata: Metadata = {
  title: "Add Member",
}

export default function NewMemberPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div>
        <Link href="/members" className="text-sm text-gray-500 hover:text-gray-700">
          ← Members
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Add Member</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Creates a managed profile without a portal account. You can send a portal invite later.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CreateManagedMemberForm />
      </div>
    </div>
  )
}
