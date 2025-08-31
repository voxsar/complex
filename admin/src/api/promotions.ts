import httpClient from './httpClient'

export interface PromotionPayload {
  name: string
  description?: string
  rules: string[]
}

export interface Promotion extends PromotionPayload {
  id: string
}

export function getPromotions() {
  return httpClient.get<Promotion[]>('/api/promotions')
}

export function createPromotion(payload: PromotionPayload) {
  return httpClient.post<Promotion, PromotionPayload>('/api/promotions', payload)
}

export function updatePromotion(id: string, payload: PromotionPayload) {
  return httpClient.put<Promotion, PromotionPayload>(`/api/promotions/${id}`, payload)
}

export function deletePromotion(id: string) {
  return httpClient.delete<void>(`/api/promotions/${id}`)
}

