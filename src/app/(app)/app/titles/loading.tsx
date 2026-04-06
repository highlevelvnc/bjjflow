export default function TitlesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 w-28 animate-pulse rounded-md bg-gray-800" />
          <div className="h-4 w-44 animate-pulse rounded-md bg-gray-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-800" />
      </div>
      {/* Titles list */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
              <div className="h-4 w-36 flex-1 animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 w-20 animate-pulse rounded-md bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
