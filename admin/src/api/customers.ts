import httpClient from './httpClient'

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  note?: string
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
}

export interface Wishlist {
  id: string
  customerId: string
  productIds: string[]
}

interface WishlistResponse {
  success: boolean
  data: Wishlist
}

interface OrdersResponse {
  orders: Order[]
}

export function getCustomer(customerId: string) {
  return httpClient.get<Customer>(`/api/customers/${customerId}`)
}

export function updateCustomer(customerId: string, data: Partial<Customer>) {
  return httpClient.put<Customer, Partial<Customer>>(`/api/customers/${customerId}`, data)
}

export function getCustomerOrders(customerId: string) {
  return httpClient.get<OrdersResponse>(`/api/orders`, { params: { customerId } })
}

export function getCustomerWishlist(customerId: string) {
  return httpClient.get<WishlistResponse>(`/api/customers/${customerId}/wishlist`)
}

export function addWishlistItem(customerId: string, productId: string) {
  return httpClient.post<WishlistResponse, { productId: string }>(`/api/customers/${customerId}/wishlist`, { productId })
}

export function removeWishlistItem(customerId: string, productId: string) {
  return httpClient.delete<WishlistResponse>(`/api/customers/${customerId}/wishlist/${productId}`)
}

export function transferWishlistItemToOrder(customerId: string, productId: string) {
  return httpClient.post(`/api/customers/${customerId}/wishlist/${productId}/transfer`, {})
}

