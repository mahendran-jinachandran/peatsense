'use client'

import { useState, useEffect } from 'react'
import { ImageOverlay } from 'react-leaflet'
import { api } from '@/services/api'
import type { Dataset } from '@/types'

interface RasterLayerProps {
  dataset: Dataset
}

export default function RasterLayer({ dataset }: RasterLayerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [bounds,   setBounds]   = useState<[[number,number],[number,number]] | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadRaster = async () => {
      try {
        const data = await api.datasets.getRasterPng(dataset.id)

        if (!cancelled) {
          setImageUrl(data.imageUrl)
          setBounds([
            [data.bounds.south, data.bounds.west],
            [data.bounds.north, data.bounds.east],
          ])
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