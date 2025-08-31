import httpClient from './httpClient'

export interface CollectionPayload {
  title: string
  description?: string
  handle?: string
}

export async function getCollections() {
  return httpClient.get('/api/collections')
}

export async function getCollection(id: string) {
  return httpClient.get(`/api/collections/${id}`)
}
