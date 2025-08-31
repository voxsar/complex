import httpClient from './httpClient'

export interface ShippingProvider {
  id: string
  name: string
  isActive: boolean
}

export interface ShippingProviderPayload {
  name: string
  isActive: boolean
}

export function getShippingProviders() {
  return httpClient.get<ShippingProvider[]>('/api/shipping-providers')
}

export function createShippingProvider(payload: ShippingProviderPayload) {
  return httpClient.post<ShippingProvider, ShippingProviderPayload>('/api/shipping-providers', payload)
}

export function deleteShippingProvider(id: string) {
  return httpClient.delete(`/api/shipping-providers/${id}`)
}
