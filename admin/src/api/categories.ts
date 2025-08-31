import httpClient from './httpClient'

export interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
  // Optionally there might be isVisible; include generics
  isVisible?: boolean
}

export async function getCategories() {
  return httpClient.get('/api/categories')
}

export async function deleteCategory(id: string) {
  return httpClient.delete(`/api/categories/${id}`)
}
