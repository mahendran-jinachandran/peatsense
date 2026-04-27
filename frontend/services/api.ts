import axios from 'axios'
import type {
  AuthTokens,
  LoginCredentials,
  Dataset,
  DatasetUploadPayload,
  InferenceJob,
  InferenceResult,
  InferenceRunPayload,
  ColourSchemesResponse,
} from '@/types'

let accessToken:  string | null = null
let refreshToken: string | null = null

export const setTokens = (tokens: AuthTokens): void => {
  accessToken  = tokens.access
  refreshToken = tokens.refresh
}

export const clearTokens = (): void => {
  accessToken  = null
  refreshToken = null
}

export const getAccessToken = (): string | null => accessToken

const axiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(
  config => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  error => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true

      try {
        const response = await axios.post('/api/auth/token/refresh/', {
          refresh: refreshToken,
        })
        const newAccessToken = response.data.access
        accessToken = newAccessToken
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const api = {

  auth: {
    login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
      const response = await axiosInstance.post('/api/auth/token/', credentials)
      return response.data
    },

    register: async (credentials: LoginCredentials): Promise<void> => {
      await axiosInstance.post('/api/auth/register/', credentials)
    },

    me: async () => {
      const response = await axiosInstance.get('/api/auth/me/')
      return response.data
    },

    refreshToken: async (refresh: string): Promise<string> => {
      const response = await axios.post('/api/auth/token/refresh/', { refresh })
      return response.data.access
    },
  },

  datasets: {
    list: async (): Promise<Dataset[]> => {
      const response = await axiosInstance.get('/api/datasets/')
      return response.data
    },

    detail: async (id: number): Promise<Dataset> => {
      const response = await axiosInstance.get(`/api/datasets/${id}/`)
      return response.data
    },

    getRasterPng: async (id: number): Promise<{
      imageUrl: string
      bounds: { west: number; south: number; east: number; north: number }
    }> => {
      const response = await axiosInstance.get(
        `/api/datasets/${id}/raster/`,
        { responseType: 'blob' }
      )
      const imageUrl = URL.createObjectURL(response.data)
      const bounds = {
        west:  parseFloat(response.headers['x-bounds-west']),
        south: parseFloat(response.headers['x-bounds-south']),
        east:  parseFloat(response.headers['x-bounds-east']),
        north: parseFloat(response.headers['x-bounds-north']),
      }
      return { imageUrl, bounds }
    },

    getVector: async (id: number) => {
      const response = await axiosInstance.get(`/api/datasets/${id}/vector/`)
      return response.data
    },

    upload: async (payload: DatasetUploadPayload): Promise<Dataset> => {
      const formData = new FormData()
      formData.append('name',         payload.name)
      formData.append('description',  payload.description)
      formData.append('dataset_type', payload.dataset_type)
      formData.append('file',         payload.file)
      const response = await axiosInstance.post(
        '/api/datasets/upload/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    },

    update: async (
      id: number,
      data: { name?: string; description?: string }
    ): Promise<Dataset> => {
      const response = await axiosInstance.patch(
        `/api/datasets/${id}/update/`,
        data
      )
      return response.data
    },

    delete: async (id: number): Promise<void> => {
      await axiosInstance.delete(`/api/datasets/${id}/delete/`)
    },

    toggleVisibility: async (
      id: number,
      isVisible: boolean
    ): Promise<void> => {
      await axiosInstance.patch(`/api/datasets/${id}/visibility/`, {
        is_visible: isVisible,
      })
    },
  },

  inference: {
    run: async (payload: InferenceRunPayload): Promise<InferenceResult> => {
      const response = await axiosInstance.post('/api/inference/run/', payload)
      return response.data
    },

    getResult: async (id: number): Promise<InferenceResult> => {
      const response = await axiosInstance.get(`/api/inference/${id}/result/`)
      return response.data
    },

    listJobs: async (): Promise<InferenceJob[]> => {
      const response = await axiosInstance.get('/api/inference/jobs/')
      return response.data
    },

    getColourSchemes: async (): Promise<string[]> => {
      const response = await axiosInstance.get('/api/inference/colour-schemes/')
      const data: ColourSchemesResponse = response.data
      return data.colour_schemes
    },
  },
}