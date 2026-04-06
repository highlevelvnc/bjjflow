export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-32 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Settings form */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-gray-800" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-800" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-24 animate-pulse rounded-lg bg-gray-800" />
      </div>
    </div>
  )
}
