export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-40 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        {[120, 160, 100].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-800" />
            <div style={{ height: h }} className="w-20 animate-pulse rounded-t-lg bg-gray-800" />
          </div>
        ))}
      </div>
      {/* Rankings list */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 w-6 animate-pulse rounded-md bg-gray-800" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-800" />
              <div className="h-4 w-32 flex-1 animate-pulse rounded-md bg-gray-800" />
              <div className="h-5 w-16 animate-pulse rounded-md bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
