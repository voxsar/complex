export interface ProductPayload {
  title: string
  description?: string
  status?: string
  variants?: any[]
  collectionIds?: string[]
  categoryIds?: string[]
}

export async function getProducts() {
  const res = await fetch('/products')
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  return res.json()
}

export async function createProduct(payload: ProductPayload) {
  const res = await fetch('/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    throw new Error('Failed to create product')
  }
  return res.json()
}
