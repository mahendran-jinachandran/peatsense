'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { Dataset, InferenceResult, ActiveLayers } from '@/types'
import RasterLayer from './RasterLayer'
import VectorLayer from './VectorLayer'
import PredictionLayer from './PredictionLayer'

interface MapViewProps {
  datasets:     Dataset[]
  activeLayers: ActiveLayers
  result:       InferenceResult | null
}

const LONDON_CENTER: [number, number] = [51.49, -0.04]
const DEFAULT_ZOOM = 10

export default function MapView({
  datasets,
  activeLayers,
  result,
}: MapViewProps) {

  return (
    <MapContainer
      center={LONDON_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {datasets.map(dataset => {
        if (!activeLayers[dataset.id]) return null

        if (dataset.dataset_type === 'raster') {
          return (
            <RasterLayer
              key={dataset.id}
              dataset={dataset}
            />
          )
        }

        if (dataset.dataset_type === 'vector') {
          return (
            <VectorLayer
              key={dataset.id}
              dataset={dataset}
            />
          )
        }

        return null
      })}

      {result && result.result_image_url && result.result_bounds && (
        <PredictionLayer result={result} />
      )}

    </MapContainer>
  )
}