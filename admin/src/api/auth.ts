import httpClient from './httpClient'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  tokens: {
    accessToken: string
    refreshToken: string
  }
  user: {
    id: string
    email: string
    role: string
  }
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export function login(payload: LoginPayload) {
  return httpClient.post<LoginResponse, LoginPayload>('/api/admin/auth/login', payload)
}

export function refreshToken(refreshToken: string) {
  return httpClient.post<RefreshTokenResponse, { refreshToken: string }>('/api/admin/auth/refresh', { refreshToken })
}

export function logout() {
  return httpClient.post('/api/admin/auth/logout', {})
}

export function getProfile() {
  return httpClient.get('/api/admin/auth/profile')
}
