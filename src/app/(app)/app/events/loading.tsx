export default function EventsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 w-32 animate-pulse rounded-md bg-gray-800" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-gray-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-800" />
      </div>
      {/* Event cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 p-5">
            <div className="h-5 w-40 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-md bg-gray-800" />
            <div className="mt-1 h-3 w-3/4 animate-pulse rounded-md bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
