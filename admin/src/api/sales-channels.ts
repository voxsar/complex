import httpClient from './httpClient'

export interface SalesChannel {
  id: string
  name: string
  description?: string
}

export function getSalesChannels() {
  return httpClient.get<{ salesChannels: SalesChannel[] }>('/sales-channels')
}

