import { PageSkeleton } from "@/components/ui/Skeleton"

export default function AttendanceLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageSkeleton />
    </div>
  )
}
