'use client'

import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import type { InferenceResult, ColourScheme } from '@/types'

export const useInference = () => {
  const [result,      setResult]      = useState<InferenceResult | null>(null)
  const [isRunning,   setIsRunning]   = useState<boolean>(false)
  const [error,       setError]       = useState<string | null>(null)
  const [nClusters,   setNClusters]   = useState<number>(8)
  const [colourScheme,setColourScheme]= useState<ColourScheme>('terrain')

  const runInference = useCallback(async (datasetId: number) => {
    try {
      setIsRunning(true)
      setError(null)
      setResult(null)

      const inferenceResult = await api.inference.run({
        dataset_id:    datasetId,
        n_clusters:    nClusters,
        colour_scheme: colourScheme,
      })

      setResult(inferenceResult)

    } catch {
      setError('Inference failed. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }, [nClusters, colourScheme])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    result,
    isRunning,
    error,
    nClusters,
    colourScheme,
    setNClusters,
    setColourScheme,
    runInference,
    clearResult,
  }
}