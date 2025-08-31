import httpClient from './httpClient'

export interface User {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export interface UserPayload {
  email: string
  password: string
  role: string
  firstName?: string
  lastName?: string
}

export function getUsers(role?: string) {
  const params = role ? { role } : undefined
  return httpClient.get<User[]>('/api/users', { params })
}

export function createUser(payload: UserPayload) {
  return httpClient.post<User, UserPayload>('/api/users/register', payload)
}

export function updateUser(id: string, payload: Partial<UserPayload>) {
  return httpClient.put<User, Partial<UserPayload>>(`/api/users/${id}`, payload)
}
