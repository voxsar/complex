import httpClient from './httpClient'

export interface ProductPayload {
  title: string
  description?: string
  status?: string
  variants?: any[]
  collectionIds?: string[]
  categoryIds?: string[]
}

export const getProducts = () => httpClient.get('/products')

export const createProduct = (payload: ProductPayload) =>
  httpClient.post('/products', payload)

export const updateProduct = (
  id: string,
  payload: Partial<ProductPayload>
) => httpClient.put(`/products/${id}`, payload)

export const deleteProduct = (id: string) =>
  httpClient.delete(`/products/${id}`)
