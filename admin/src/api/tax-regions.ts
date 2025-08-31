import httpClient from './httpClient'

export interface TaxRegion {
  id: string
  name: string
  taxRate: number
  isActive: boolean
}

export interface TaxRegionPayload {
  name: string
  taxRate: number
  isActive: boolean
}

export interface TaxCalculationPayload {
  amount: number
  productIds?: string[]
}

export function getTaxRegions() {
  return httpClient.get<TaxRegion[]>('/api/tax-regions')
}

export function createTaxRegion(payload: TaxRegionPayload) {
  return httpClient.post<TaxRegion, TaxRegionPayload>('/api/tax-regions', payload)
}

export function updateTaxRegion(id: string, payload: TaxRegionPayload) {
  return httpClient.put<TaxRegion, TaxRegionPayload>(`/api/tax-regions/${id}`, payload)
}

export function deleteTaxRegion(id: string) {
  return httpClient.delete(`/api/tax-regions/${id}`)
}

export function calculateTax(regionId: string, payload: TaxCalculationPayload) {
  return httpClient.post(`/api/tax-regions/${regionId}/calculate`, payload)
}
