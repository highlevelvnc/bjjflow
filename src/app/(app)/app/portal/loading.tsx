export default function PortalLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-40 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Portal settings card */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-5 w-32 animate-pulse rounded-md bg-gray-800" />
        <div className="mt-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded-md bg-gray-800" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
      {/* Preview */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-5 w-28 animate-pulse rounded-md bg-gray-800" />
        <div className="mt-4 h-48 animate-pulse rounded-lg bg-gray-800" />
      </div>
    </div>
  )
}
