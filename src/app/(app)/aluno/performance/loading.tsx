import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="h-7 w-48 animate-pulse rounded-md bg-gray-800" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-gray-800" />
      <div className="mt-6 flex h-[460px] items-center justify-center rounded-2xl border border-white/8 bg-gray-900/60">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    </div>
  )
}
