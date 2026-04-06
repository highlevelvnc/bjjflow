export default function BenchmarkLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-6 w-52 animate-pulse rounded-md bg-gray-800" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-gray-800" />
      </div>
      {/* Benchmark stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 px-5 py-4">
            <div className="h-4 w-24 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-1 h-3 w-20 animate-pulse rounded-md bg-gray-800" />
          </div>
        ))}
      </div>
      {/* Comparison charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-gray-900 p-5">
            <div className="h-5 w-36 animate-pulse rounded-md bg-gray-800" />
            <div className="mt-4 h-40 animate-pulse rounded-lg bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
