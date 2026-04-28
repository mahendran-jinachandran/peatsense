'use client'

import { useState, useCallback } from 'react'
import type { ActiveLayers } from '@/types'

export const useMapLayers = () => {
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>({})

  const toggleLayer = useCallback((datasetId: number) => {
    setActiveLayers(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId],
    }))
  }, [])

  const isLayerActive = useCallback((datasetId: number): boolean => {
    return activeLayers[datasetId] === true
  }, [activeLayers])

  const deactivateLayer = useCallback((datasetId: number) => {
    setActiveLayers(prev => ({
      ...prev,
      [datasetId]: false,
    }))
  }, [])

  const deactivateAll = useCallback(() => {
    setActiveLayers({})
  }, [])

  return {
    activeLayers,
    toggleLayer,
    isLayerActive,
    deactivateLayer,
    deactivateAll,
  }
}