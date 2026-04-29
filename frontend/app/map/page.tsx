'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth }      from '@/hooks/useAuth'
import { useDatasets }  from '@/hooks/useDatasets'
import { useMapLayers } from '@/hooks/useMapLayers'
import { useInference } from '@/hooks/useInference'
import Navbar       from '@/components/ui/Navbar'
import Sidebar      from '@/components/sidebar/Sidebar'
import Legend       from '@/components/legend/Legend'
import UploadModal  from '@/components/ui/UploadModal'

const MapView = dynamic(
  () => import('@/components/map/MapView'),
  {
    ssr:     false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
)

export default function MapPage() {

  const { user, logout, isLoading: isAuthLoading } = useAuth()
  const [showUpload, setShowUpload] = useState(false)

  const {
    datasets,
    isLoading,
    refetch,
    deleteDataset,
  } = useDatasets()

  const {
    activeLayers,
    toggleLayer,
    activateExclusiveLayer,
    isLayerActive,
    deactivateLayer,
  } = useMapLayers()

  const {
    result,
    isRunning,
    error:          inferenceError,
    nClusters,
    colourScheme,
    setNClusters,
    setColourScheme,
    runInference,
    clearResult,
  } = useInference()

  useEffect(() => {
    if (!isAuthLoading) {
      refetch()
    }
  }, [user, isAuthLoading])

  const rasterIds = datasets
    .filter(d => d.dataset_type === 'raster')
    .map(d => d.id)

  const handleToggleLayer = (id: number) => {
    const dataset = datasets.find(d => d.id === id)

    if (dataset?.dataset_type === 'raster') {
      if (isLayerActive(id) && result) {
        clearResult()
      }
      activateExclusiveLayer(id, rasterIds)
    } else {
      toggleLayer(id)
    }
  }

  return (
    <div className="flex flex-col h-screen">

      <Navbar
        user={user}
        onLogout={logout}
        onUpload={() => setShowUpload(true)}
      />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          datasets={datasets}
          isLoading={isLoading}
          activeLayers={activeLayers}
          isLayerActive={isLayerActive}
          onToggleLayer={handleToggleLayer}
          onDeleteDataset={(id) => {
            deactivateLayer(id)
            deleteDataset(id)
            clearResult()
          }}
          isStaff={user?.is_staff ?? false}
          currentUsername={user?.username ?? null}
          result={result}
          isRunning={isRunning}
          inferenceError={inferenceError}
          nClusters={nClusters}
          colourScheme={colourScheme}
          onNClustersChange={setNClusters}
          onColourSchemeChange={setColourScheme}
          onRunInference={runInference}
          onClearResult={clearResult}
          onRefetch={refetch}
        />

        <div className="flex-1 relative">
          <MapView
            datasets={datasets}
            activeLayers={activeLayers}
            result={result}
          />

          {result?.colour_legend && (
            <Legend legend={result.colour_legend} />
          )}
        </div>

      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={refetch}
        />
      )}

    </div>
  )
}