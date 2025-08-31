export interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
  // Optionally there might be isVisible; include generics
  isVisible?: boolean
}

export async function getCategories() {
  const res = await fetch('/api/categories')
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  return res.json()
}

export async function deleteCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error('Failed to delete category')
  }
  return res.text()
}
