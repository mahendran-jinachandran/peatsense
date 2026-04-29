'use client'

import { useState } from 'react'
import { api } from '@/services/api'
import type { Dataset, ColourScheme, InferenceResult } from '@/types'
import InferencePanel from './InferencePanel'

interface SidebarProps {
  datasets:             Dataset[]
  isLoading:            boolean
  activeLayers:         { [id: number]: boolean }
  isLayerActive:        (id: number) => boolean
  onToggleLayer:        (id: number) => void
  onDeleteDataset:      (id: number) => void
  isStaff:              boolean
  currentUsername:      string | null
  result:               InferenceResult | null
  isRunning:            boolean
  inferenceError:       string | null
  nClusters:            number
  colourScheme:         ColourScheme
  onNClustersChange:    (n: number) => void
  onColourSchemeChange: (scheme: ColourScheme) => void
  onRunInference:       (datasetId: number) => void
  onClearResult:        () => void
  onRefetch:            () => void
}

export default function Sidebar({
  datasets,
  isLoading,
  isLayerActive,
  onToggleLayer,
  onDeleteDataset,
  isStaff,
  currentUsername,
  result,
  isRunning,
  inferenceError,
  nClusters,
  colourScheme,
  onNClustersChange,
  onColourSchemeChange,
  onRunInference,
  onClearResult,
  onRefetch,
}: SidebarProps) {

  const [togglingVisibility, setTogglingVisibility] = useState<number | null>(null)

  const rasterDatasets = datasets.filter(d => d.dataset_type === 'raster')
  const activeRaster   = rasterDatasets.find(d => isLayerActive(d.id))

  const handleVisibilityToggle = async (dataset: Dataset) => {
    setTogglingVisibility(dataset.id)
    try {
      await api.datasets.toggleVisibility(dataset.id, !dataset.is_visible)
      onRefetch()
    } catch {
      // silently fail — dataset list will stay as is
    } finally {
      setTogglingVisibility(null)
    }
  }

  const isOwner = (dataset: Dataset): boolean => {
    return dataset.uploaded_by === currentUsername
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200
                    flex flex-col shrink-0 overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Datasets</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Toggle layers to display on map
        </p>
      </div>

      {/* Dataset List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">

        {isLoading && (
          <p className="text-sm text-gray-500">Loading datasets...</p>
        )}

        {!isLoading && datasets.length === 0 && (
          <p className="text-sm text-gray-500">No datasets available.</p>
        )}

        {datasets.map(dataset => (
          <div
            key={dataset.id}
            className="border border-gray-200 rounded-lg p-3"
          >
            {/* Dataset Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {dataset.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    dataset.dataset_type === 'raster'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-purple-50 text-purple-600'
                  }`}>
                    {dataset.dataset_type}
                  </span>
                  {!dataset.is_visible && (
                    <span className="text-xs text-gray-400">
                      Hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">

                {/* Visibility Toggle — only for owner */}
                {isOwner(dataset) && (
                  <button
                    onClick={() => handleVisibilityToggle(dataset)}
                    disabled={togglingVisibility === dataset.id}
                    title={dataset.is_visible ? 'Make private' : 'Make public'}
                    className="px-2 py-1 rounded text-sm
                               hover:bg-gray-100 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {togglingVisibility === dataset.id
                      ? '...'
                      : dataset.is_visible ? '👁' : '🚫'
                    }
                  </button>
                )}

                {/* Layer Toggle */}
                <button
                  onClick={() => onToggleLayer(dataset.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium
                              transition-colors ${
                    isLayerActive(dataset.id)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isLayerActive(dataset.id) ? 'On' : 'Off'}
                </button>

                {/* Delete — only for owner */}
                {isOwner(dataset) && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${dataset.name}"?`)) {
                        onDeleteDataset(dataset.id)
                      }
                    }}
                    className="px-2 py-1 rounded text-xs
                               text-red-500 hover:bg-red-50
                               transition-colors"
                  >
                    ✕
                  </button>
                )}

              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Inference Panel */}
      {activeRaster && (
        <div className="p-4 border-t border-gray-200 shrink-0">
          <InferencePanel
            datasetId={activeRaster.id}
            nClusters={nClusters}
            colourScheme={colourScheme}
            isRunning={isRunning}
            error={inferenceError}
            onNClustersChange={onNClustersChange}
            onColourSchemeChange={onColourSchemeChange}
            onRun={onRunInference}
            onClear={onClearResult}
          />
        </div>
      )}

    </div>
  )
}