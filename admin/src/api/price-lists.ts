import httpClient from './httpClient'

export interface PriceList {
  id: string
  title: string
  description?: string
  type: string
  status: string
  salesChannelIds: string[]
}

export interface PriceListPayload {
  title: string
  description?: string
  type?: string
  status?: string
  salesChannelIds?: string[]
}

export function getPriceLists() {
  return httpClient.get<{ priceLists: PriceList[] }>('/price-lists')
}

export function createPriceList(payload: PriceListPayload) {
  return httpClient.post('/price-lists', payload)
}

export function updatePriceList(id: string, payload: PriceListPayload) {
  return httpClient.put(`/price-lists/${id}`, payload)
}

export function deletePriceList(id: string) {
  return httpClient.delete(`/price-lists/${id}`)
}

