'use client'

import type { ColourScheme } from '@/types'

interface InferencePanelProps {
  datasetId:      number
  nClusters:      number
  colourScheme:   ColourScheme
  isRunning:      boolean
  error:          string | null
  onNClustersChange:    (n: number) => void
  onColourSchemeChange: (scheme: ColourScheme) => void
  onRun:          (datasetId: number) => void
  onClear:        () => void
}

const COLOUR_SCHEMES: ColourScheme[] = [
  'default',
  'terrain',
  'spectral',
  'monochrome',
]

export default function InferencePanel({
  datasetId,
  nClusters,
  colourScheme,
  isRunning,
  error,
  onNClustersChange,
  onColourSchemeChange,
  onRun,
  onClear,
}: InferencePanelProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">

      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Run Analysis
      </h3>

      {/* Cluster Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-600">
            Clusters
          </label>
          <span className="text-xs font-medium text-gray-800">
            {nClusters}
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={20}
          value={nClusters}
          onChange={(e) => onNClustersChange(Number(e.target.value))}
          disabled={isRunning}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>2</span>
          <span>20</span>
        </div>
      </div>

      {/* Colour Scheme Dropdown */}
      <div className="mb-4">
        <label className="text-xs text-gray-600 block mb-1">
          Colour Scheme
        </label>
        <select
          value={colourScheme}
          onChange={(e) => onColourSchemeChange(e.target.value as ColourScheme)}
          disabled={isRunning}
          className="w-full text-sm border border-gray-300 rounded
                     px-2 py-1.5 focus:outline-none
                     focus:ring-2 focus:ring-green-500"
        >
          {COLOUR_SCHEMES.map(scheme => (
            <option key={scheme} value={scheme}>
              {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onRun(datasetId)}
          disabled={isRunning}
          className="flex-1 py-2 bg-green-600 text-white
                     text-sm font-medium rounded
                     hover:bg-green-700 disabled:bg-green-300
                     disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Analysing...' : 'Run Analysis'}
        </button>

        <button
          onClick={onClear}
          disabled={isRunning}
          className="px-3 py-2 bg-gray-100 text-gray-600
                     text-sm rounded hover:bg-gray-200
                     disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>

      {isRunning && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          This may take 20-30 seconds...
        </p>
      )}

    </div>
  )
}