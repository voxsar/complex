<template>
  <div class="login-container">
    <h1>Admin Login</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function login() {
  error.value = ''
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem('accessToken', data.tokens.accessToken)
    localStorage.setItem('refreshToken', data.tokens.refreshToken)
    router.push('/')
  } catch (err: any) {
    error.value = err.message
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}
form {
  display: flex;
  flex-direction: column;
  width: 300px;
  gap: 10px;
}
.error {
  color: red;
}
</style>
