import httpClient from './httpClient'

export interface ProductOption {
  id: string
  name: string
  displayName?: string
  inputType: string
  isRequired: boolean
  position: number
}

export interface ProductOptionPayload {
  name: string
  displayName?: string
  inputType: string
  isRequired: boolean
}

export const listProductOptions = async (): Promise<ProductOption[]> => {
  const data = await httpClient.get<{ options: ProductOption[] }>('/api/product-options')
  return data.options ?? []
}

export const createProductOption = (payload: ProductOptionPayload) =>
  httpClient.post<ProductOption>('/api/product-options', {
    ...payload,
    values: [],
    productIds: []
  })

export const updateProductOption = (id: string, payload: Partial<ProductOptionPayload>) =>
  httpClient.put<ProductOption>(`/api/product-options/${id}`, payload)

export const deleteProductOption = (id: string) =>
  httpClient.delete<void>(`/api/product-options/${id}`)
