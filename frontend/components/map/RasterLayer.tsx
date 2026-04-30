'use client'

import { useState, useEffect } from 'react'
import { ImageOverlay, useMap } from 'react-leaflet'
import { api } from '@/services/api'
import type { Dataset } from '@/types'

interface RasterLayerProps {
  dataset: Dataset
}

export default function RasterLayer({ dataset }: RasterLayerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [bounds,   setBounds]   = useState<[[number,number],[number,number]] | null>(null)
  const map = useMap()

  useEffect(() => {
    let cancelled = false

    const loadRaster = async () => {
      try {
        const data = await api.datasets.getRasterPng(dataset.id)

        if (!cancelled) {
          const leafletBounds: [[number,number],[number,number]] = [
            [data.bounds.south, data.bounds.west],
            [data.bounds.north, data.bounds.east],
          ]

          setImageUrl(data.imageUrl)
          setBounds(leafletBounds)

          // Auto zoom to the layer
          map.fitBounds(leafletBounds, { padding: [20, 20] })
        }
      } catch (err) {
        console.error('Failed to load raster:', err)
      }
    }

    loadRaster()

    return () => {
      cancelled = true
    }
  }, [dataset.id])

  if (!imageUrl || !bounds) {
    return null
  }

  return (
    <ImageOverlay
      url={imageUrl}
      bounds={bounds}
      opacity={0.8}
    />
  )
}