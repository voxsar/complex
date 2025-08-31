// Use environment variable with fallback to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

type RequestConfig = RequestInit & { params?: Record<string, any> }

function buildUrl(endpoint: string, params?: Record<string, any>): string {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured')
  }
  const url = new URL(endpoint, API_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }
  return url.toString()
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, headers, ...init } = config
  const url = buildUrl(endpoint, params)
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...init
  })
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }
  return await response.json() as T
}

export const httpClient = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'GET' }),
  post: <T, B = unknown>(endpoint: string, body: B, config?: Omit<RequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'POST', body: JSON.stringify(body) }),
  put: <T, B = unknown>(endpoint: string, body: B, config?: Omit<RequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'DELETE' })
}

export default httpClient
