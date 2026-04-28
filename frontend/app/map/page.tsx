'use client'

import dynamic from 'next/dynamic'
import { useAuth }      from '@/hooks/useAuth'
import { useDatasets }  from '@/hooks/useDatasets'
import { useMapLayers } from '@/hooks/useMapLayers'
import { useInference } from '@/hooks/useInference'
import Navbar  from '@/components/ui/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Legend  from '@/components/legend/Legend'

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

  const { user, logout } = useAuth()

  const {
    datasets,
    isLoading,
    refetch,
    deleteDataset,
  } = useDatasets()

  const {
    activeLayers,
    toggleLayer,
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

  return (
    <div className="flex flex-col h-screen">

      <Navbar
        user={user}
        onLogout={logout}
      />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          datasets={datasets}
          isLoading={isLoading}
          activeLayers={activeLayers}
          isLayerActive={isLayerActive}
          onToggleLayer={toggleLayer}
          onDeleteDataset={(id) => {
            deactivateLayer(id)
            deleteDataset(id)
          }}
          isStaff={user?.is_staff ?? false}
          result={result}
          isRunning={isRunning}
          inferenceError={inferenceError}
          nClusters={nClusters}
          colourScheme={colourScheme}
          onNClustersChange={setNClusters}
          onColourSchemeChange={setColourScheme}
          onRunInference={runInference}
          onClearResult={clearResult}
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
    </div>
  )
}