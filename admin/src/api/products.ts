import httpClient from './httpClient'

export interface ProductPayload {
  title: string
  description?: string
  status?: string
  variants?: any[]
  collectionIds?: string[]
  categoryIds?: string[]
}

export const getProducts = () => httpClient.get('/api/products')

export const createProduct = (payload: ProductPayload) =>
  httpClient.post('/api/products', payload)

export const updateProduct = (
  id: string,
  payload: Partial<ProductPayload>
) => httpClient.put(`/api/products/${id}`, payload)

export const deleteProduct = (id: string) =>
  httpClient.delete(`/api/products/${id}`)
