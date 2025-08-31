import httpClient from './httpClient'

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  isActive: boolean
}

export interface WebhookEndpointPayload {
  url: string
  events: string[]
  isActive: boolean
}

export function getWebhookEndpoints() {
  return httpClient.get<WebhookEndpoint[]>('/api/webhooks/endpoints')
}

export function createWebhookEndpoint(payload: WebhookEndpointPayload) {
  return httpClient.post<WebhookEndpoint, WebhookEndpointPayload>('/api/webhooks/endpoints', payload)
}

export function updateWebhookEndpoint(id: string, payload: WebhookEndpointPayload) {
  return httpClient.put<WebhookEndpoint, WebhookEndpointPayload>(`/api/webhooks/endpoints/${id}`, payload)
}

export function deleteWebhookEndpoint(id: string) {
  return httpClient.delete(`/api/webhooks/endpoints/${id}`)
}
