import httpClient from './httpClient'

export interface CollectionPayload {
  title: string
  handle?: string
}

export const createCollection = (payload: CollectionPayload) =>
  httpClient.post('/api/collections', payload)

export default {
  createCollection
}
