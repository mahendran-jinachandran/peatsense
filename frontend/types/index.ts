export interface Bounds {
  west:  number
  south: number
  east:  number
  north: number
}

export interface User {
  id:       number
  username: string
  email:    string
  is_staff: boolean
}

export interface AuthTokens {
  access:  string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export type DatasetType   = 'raster' | 'vector'
export type UploadStatus  = 'pending' | 'completed' | 'failed'

export interface Dataset {
  id:            number
  name:          string
  description:   string
  dataset_type:  DatasetType
  is_visible:    boolean
  upload_status: UploadStatus
  bounds:        Bounds | null
  crs:           string
  band_count:    number | null
  pixel_width:   number | null
  pixel_height:  number | null
  feature_count: number | null
  geometry_type: string
  uploaded_by:   string | null
  created_at:    string
  updated_at:    string
}

export interface DatasetUploadPayload {
  name:         string
  description:  string
  dataset_type: DatasetType
  file:         File
}

export type InferenceStatus = 'pending' | 'running' | 'completed' | 'failed'
export type ColourScheme    = 'default' | 'terrain' | 'spectral' | 'monochrome'

export interface ColourLegendEntry {
  hex:   string
  rgb:   [number, number, number]
  label: string
}

export interface ColourLegend {
  [clusterId: string]: ColourLegendEntry
}

export interface InferenceJob {
  id:            number
  dataset:       string
  status:        InferenceStatus
  n_clusters:    number
  colour_scheme: ColourScheme
  mlflow_run_id: string
  error_message: string
  created_by:    string
  created_at:    string
}

export interface InferenceResult {
  id:               number
  status:           InferenceStatus
  n_clusters:       number
  colour_scheme:    ColourScheme
  result_image_url: string | null
  result_bounds:    Bounds | null
  colour_legend:    ColourLegend | null
  mlflow_run_id:    string
  error_message:    string
}

export interface InferenceRunPayload {
  dataset_id:    number
  n_clusters:    number
  colour_scheme: ColourScheme
}

export interface ActiveLayers {
  [datasetId: number]: boolean
}

export interface ApiError {
  detail?:  string
  error?:   string
  message?: string
}

export interface ColourSchemesResponse {
  colour_schemes: ColourScheme[]
}