import httpClient from './httpClient'

export interface Wishlist {
  id: string
  customerId: string
  productIds: string[]
}

interface WishlistResponse {
  success: boolean
  data: Wishlist
}

export function getCustomerWishlist(customerId: string) {
  return httpClient.get<WishlistResponse>(`/customers/${customerId}/wishlist`)
}

export function addWishlistItem(customerId: string, productId: string) {
  return httpClient.post<WishlistResponse, { productId: string }>(`/customers/${customerId}/wishlist`, { productId })
}

export function removeWishlistItem(customerId: string, productId: string) {
  return httpClient.delete<WishlistResponse>(`/customers/${customerId}/wishlist/${productId}`)
}

