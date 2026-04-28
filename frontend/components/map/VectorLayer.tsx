'use client'

import { useState, useEffect } from 'react'
import { GeoJSON } from 'react-leaflet'
import { api } from '@/services/api'
import type { Dataset } from '@/types'

interface VectorLayerProps {
  dataset: Dataset
}

export default function VectorLayer({ dataset }: VectorLayerProps) {
  const [geojsonData, setGeojsonData] = useState<GeoJSON.GeoJsonObject | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadVector = async () => {
      try {
        const data = await api.datasets.getVector(dataset.id)
        if (!cancelled) {
          setGeojsonData(data)
        }
      } catch (err) {
        console.error('Failed to load vector:', err)
      }
    }

    loadVector()

    return () => { cancelled = true }
  }, [dataset.id])

  if (!geojsonData) return null

  return (
    <GeoJSON
      key={dataset.id}
      data={geojsonData}
      style={{
        color:       '#2563eb',
        weight:      2,
        opacity:     0.8,
        fillOpacity: 0.1,
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties) {
          const name = feature.properties.District_N
                    || feature.properties.name
                    || feature.properties.NAME
                    || 'Unknown'
          layer.bindPopup(`<strong>${name}</strong>`)
        }
      }}
    />
  )
}