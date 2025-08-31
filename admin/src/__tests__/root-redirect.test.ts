import { describe, it, expect, beforeEach } from 'vitest'
import router from '../router'

// Ensure navigation starts from a clean state for each test
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('accessToken', 'test-token')
})

describe('root path redirect', () => {
  it('redirects / to the products list', async () => {
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.fullPath).toBe('/products')
  })
})
