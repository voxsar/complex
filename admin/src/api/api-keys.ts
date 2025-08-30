import httpClient from './httpClient'

export interface ApiKeyPayload {
  name: string
  description?: string
  permissions?: string[]
  scopes?: string[]
  expiresAt?: string
  allowedIPs?: string[]
  rateLimitPerHour?: number
}

export const getApiKeys = (params?: Record<string, any>) =>
  httpClient.get('/api/admin/api-keys', { params })

export const getApiKey = (id: string) =>
  httpClient.get(`/api/admin/api-keys/${id}`)

export const createApiKey = (payload: ApiKeyPayload) =>
  httpClient.post('/api/admin/api-keys', payload)

export const updateApiKey = (id: string, payload: ApiKeyPayload) =>
  httpClient.put(`/api/admin/api-keys/${id}`, payload)

export const deleteApiKey = (id: string) =>
  httpClient.delete(`/api/admin/api-keys/${id}`)

export const regenerateApiKey = (id: string) =>
  httpClient.post(`/api/admin/api-keys/${id}/regenerate`, {})

export const getApiKeyUsage = (id: string) =>
  httpClient.get(`/api/admin/api-keys/${id}/usage`)
