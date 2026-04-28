'use client'

import { useState, useRef } from 'react'
import { api } from '@/services/api'
import type { DatasetType } from '@/types'

interface UploadModalProps {
  onClose:   () => void
  onSuccess: () => void
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [datasetType, setDatasetType] = useState<DatasetType>('raster')
  const [file,        setFile]        = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter a dataset name.')
      return
    }

    if (!file) {
      setError('Please select a file.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      await api.datasets.upload({
        name:         name.trim(),
        description:  description.trim(),
        dataset_type: datasetType,
        file,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Upload Dataset
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dublin Raster 2026"
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-green-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                disabled={isUploading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-green-500 resize-none"
              />
            </div>

            {/* Dataset Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Type
              </label>
              <select
                value={datasetType}
                onChange={(e) => setDatasetType(e.target.value as DatasetType)}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           text-sm focus:outline-none focus:ring-2
                           focus:ring-green-500"
              >
                <option value="raster">Raster (GeoTIFF)</option>
                <option value="vector">Vector (GeoJSON)</option>
              </select>
            </div>

            {/* File Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-4 border-2 border-dashed
                           border-gray-300 rounded-md text-center
                           cursor-pointer hover:border-green-400
                           transition-colors"
              >
                {file ? (
                  <p className="text-sm text-gray-700">{file.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Click to select a file
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".tif,.tiff,.geojson,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 py-2 border border-gray-300 text-gray-700
                           rounded-md text-sm font-medium hover:bg-gray-50
                           disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !file || !name.trim()}
                className="flex-1 py-2 bg-green-600 text-white rounded-md
                           text-sm font-medium hover:bg-green-700
                           disabled:bg-green-300 disabled:cursor-not-allowed
                           transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}