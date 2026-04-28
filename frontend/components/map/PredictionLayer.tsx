'use client'

import { ImageOverlay } from 'react-leaflet'
import type { InferenceResult } from '@/types'

interface PredictionLayerProps {
  result: InferenceResult
}

export default function PredictionLayer({ result }: PredictionLayerProps) {
  if (
    !result.result_image_url ||
    !result.result_bounds
  ) {
    return null
  }

  const bounds: [[number, number], [number, number]] = [
    [result.result_bounds.south, result.result_bounds.west],
    [result.result_bounds.north, result.result_bounds.east],
  ]

  const imageUrl = result.result_image_url.startsWith('/')
    ? `http://localhost:8000${result.result_image_url}`
    : result.result_image_url

  return (
    <ImageOverlay
      url={imageUrl}
      bounds={bounds}
      opacity={0.85}
    />
  )
}