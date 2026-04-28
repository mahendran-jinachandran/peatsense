'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type { Dataset } from '@/types'

export const useDatasets = () => {
  const [datasets,  setDatasets]  = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchDatasets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.datasets.list()
      setDatasets(data)
    } catch {
      setError('Failed to load datasets.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  const deleteDataset = useCallback(async (id: number) => {
    try {
      await api.datasets.delete(id)
      await fetchDatasets()
    } catch {
      setError('Failed to delete dataset.')
    }
  }, [fetchDatasets])

  const toggleVisibility = useCallback(async (
    id: number,
    isVisible: boolean
  ) => {
    try {
      await api.datasets.toggleVisibility(id, isVisible)
      await fetchDatasets()
    } catch {
      setError('Failed to update visibility.')
    }
  }, [fetchDatasets])

  return {
    datasets,
    isLoading,
    error,
    refetch:         fetchDatasets,
    deleteDataset,
    toggleVisibility,
  }
}