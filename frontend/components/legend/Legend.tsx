'use client'

import type { ColourLegend as ColourLegendType } from '@/types'

interface LegendProps {
  legend: ColourLegendType
}

export default function Legend({ legend }: LegendProps) {
  const entries = Object.entries(legend)

  if (entries.length === 0) return null

  return (
    <div className="absolute bottom-8 right-4 z-10
                    bg-white rounded-lg shadow-lg p-4
                    border border-gray-200 min-w-36">

      <h3 className="text-xs font-semibold text-gray-600
                     uppercase tracking-wide mb-3">
        Land Cover
      </h3>

      <div className="space-y-1.5">
        {entries.map(([clusterId, entry]) => (
          <div
            key={clusterId}
            className="flex items-center gap-2"
          >
            <div
              className="w-4 h-4 rounded-sm shrink-0"
              style={{ backgroundColor: entry.hex }}
            />
            <span className="text-xs text-gray-700">
              {entry.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}