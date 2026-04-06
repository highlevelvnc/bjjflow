"use client"

interface WeekData {
  label: string
  count: number
}

interface AttendanceChartProps {
  weeks: WeekData[]
}

export function AttendanceChart({ weeks }: AttendanceChartProps) {
  const maxCount = Math.max(...weeks.map((w) => w.count), 1) // avoid division by zero
  const totalAttendance = weeks.reduce((sum, w) => sum + w.count, 0)

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">{totalAttendance}</span>
        <span className="text-sm text-gray-500">check-ins em 4 semanas</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3" style={{ height: 160 }}>
        {weeks.map((week) => {
          const heightPercent = maxCount > 0 ? (week.count / maxCount) * 100 : 0
          const barHeight = Math.max(heightPercent, 4) // minimum visible height

          return (
            <div key={week.label} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Count label */}
              <span className="text-xs font-medium text-gray-400">{week.count}</span>

              {/* Bar container */}
              <div className="relative flex w-full justify-center" style={{ height: 120 }}>
                <div
                  className="w-full max-w-[48px] rounded-t-md bg-brand-500/70 transition-all hover:bg-brand-500"
                  style={{
                    height: `${barHeight}%`,
                    position: "absolute",
                    bottom: 0,
                  }}
                />
              </div>

              {/* Week label */}
              <span className="text-[11px] font-medium text-gray-500">{week.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
