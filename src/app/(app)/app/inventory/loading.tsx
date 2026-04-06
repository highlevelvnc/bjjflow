export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-6 w-36 animate-pulse rounded-md bg-gray-800" />
          <div className="h-4 w-44 animate-pulse rounded-md bg-gray-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-800" />
      </div>
      {/* Inventory grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-28 animate-pulse rounded-md bg-gray-800" />
                <div className="h-3 w-16 animate-pulse rounded-md bg-gray-800" />
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              <div className="h-4 w-16 animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 w-12 animate-pulse rounded-md bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
