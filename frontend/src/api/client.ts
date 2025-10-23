import axios from 'axios'

const API_BASE_URL = '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('model', file)

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const analyzeModel = async (filePath: string) => {
  const response = await api.post('/slicing/analyze', { filePath })
  return response.data
}

export const getMaterials = async () => {
  const response = await api.get('/profile/materials')
  return response.data
}

export const getPrinters = async () => {
  const response = await api.get('/profile/printers')
  return response.data
}

export const optimizeWithAI = async (data: {
  modelAnalysis: any
  materialProfile: any
  printerProfile: any
  userPreferences?: any
}) => {
  const response = await api.post('/ai/optimize', data)
  return response.data
}

export const generateGCode = async (data: {
  filePath: string
  settings: any
}) => {
  const response = await api.post('/slicing/generate-gcode', data)
  return response.data
}
