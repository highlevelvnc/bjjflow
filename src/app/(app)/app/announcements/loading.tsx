export default function AnnouncementsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 w-44 animate-pulse rounded-md bg-gray-800" />
          <div className="h-4 w-36 animate-pulse rounded-md bg-gray-800" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-800" />
      </div>
      {/* Feed items */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 p-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-800" />
              <div className="space-y-1">
                <div className="h-4 w-32 animate-pulse rounded-md bg-gray-800" />
                <div className="h-3 w-20 animate-pulse rounded-md bg-gray-800" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-4 w-full animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
