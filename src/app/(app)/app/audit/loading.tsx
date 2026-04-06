export default function AuditLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 w-32 animate-pulse rounded-md bg-gray-800" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-gray-800" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-800" />
      </div>
      {/* Log entries */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-white/5 pb-3">
              <div className="h-4 w-28 animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 w-24 animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 flex-1 animate-pulse rounded-md bg-gray-800" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
