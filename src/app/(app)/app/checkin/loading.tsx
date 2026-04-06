export default function CheckinLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-32 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Search bar */}
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-800" />
      {/* Recent check-ins */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-5 w-36 animate-pulse rounded-md bg-gray-800" />
        <div className="mt-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-800" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 animate-pulse rounded-md bg-gray-800" />
                <div className="h-3 w-20 animate-pulse rounded-md bg-gray-800" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-md bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
