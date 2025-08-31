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
import { login as loginApi } from '../api/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function login() {
  error.value = ''
  try {
    const data = await loginApi({ 
      email: email.value, 
      password: password.value 
    })

    localStorage.setItem('accessToken', data.tokens.accessToken)
    localStorage.setItem('refreshToken', data.tokens.refreshToken)
    router.push('/products')
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
