import httpClient from './httpClient'

export interface CollectionPayload {
  title: string
  description?: string
  handle?: string
}

export async function getCollections() {
  const res = await fetch('/collections')
  if (!res.ok) {
    throw new Error('Failed to fetch collections')
  }
  return res.json()
}

export async function getCollection(id: string) {
  const res = await fetch(`/collections/${id}`)
  if (!res.ok) {
    throw new Error('Failed to fetch collection')
  }
  return res.json()
}
