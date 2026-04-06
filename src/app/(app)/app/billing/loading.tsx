export default function BillingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-32 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 px-5 py-4">
            <div className="h-4 w-24 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-2 h-8 w-20 animate-pulse rounded-md bg-gray-800" />
          </div>
        ))}
      </div>
      {/* Plan / invoices */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-5 w-28 animate-pulse rounded-md bg-gray-800" />
        <div className="mt-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-40 animate-pulse rounded-md bg-gray-800" />
              <div className="h-4 w-20 animate-pulse rounded-md bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
