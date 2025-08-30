export function setupAuthFetch() {
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken')
    const headers = new Headers(init.headers || {})
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return originalFetch(input, { ...init, headers })
  }
}
