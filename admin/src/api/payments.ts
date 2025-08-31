import httpClient from './httpClient'

export interface PaymentProvider {
  id: string
  name: string
  description?: string
  config: Record<string, any>
}

export interface PaymentProviderPayload {
  name: string
  description?: string
  config: Record<string, any>
}

export function getPaymentProviders() {
  return httpClient.get<PaymentProvider[]>('/api/payment-providers')
}

export function createPaymentProvider(payload: PaymentProviderPayload) {
  return httpClient.post<PaymentProvider, PaymentProviderPayload>('/api/payment-providers', payload)
}

export function updatePaymentProvider(id: string, payload: PaymentProviderPayload) {
  return httpClient.put<PaymentProvider, PaymentProviderPayload>(`/api/payment-providers/${id}`, payload)
}
