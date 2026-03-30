import { PageSkeleton, StatsSkeleton } from "@/components/ui/Skeleton"

/** Shown while the dashboard home page streams in. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
      </div>
      <StatsSkeleton />
      <PageSkeleton />
    </div>
  )
}
