<template>
  <div class="customer-create">
    <h1>Create Customer</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label>First Name</label>
        <input v-model="form.firstName" />
        <span v-if="errors.firstName" class="error">{{ errors.firstName }}</span>
      </div>
      <div>
        <label>Last Name</label>
        <input v-model="form.lastName" />
        <span v-if="errors.lastName" class="error">{{ errors.lastName }}</span>
      </div>
      <div>
        <label>Email</label>
        <input v-model="form.email" type="email" />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>
      <div>
        <label>Phone</label>
        <input v-model="form.phone" />
      </div>
      <div>
        <label>Note</label>
        <textarea v-model="form.note"></textarea>
      </div>
      <div v-if="errors.general" class="error">{{ errors.general }}</div>
      <button type="submit" :disabled="isSubmitting">Create</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCustomer, type CreateCustomerPayload, type Customer } from '../../api/customers'

const router = useRouter()

const form = reactive<CreateCustomerPayload>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  note: ''
})

const errors = reactive<{ firstName?: string; lastName?: string; email?: string; general?: string }>({})
const isSubmitting = ref(false)

function validate() {
  errors.firstName = form.firstName ? '' : 'First name is required'
  errors.lastName = form.lastName ? '' : 'Last name is required'
  if (!form.email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email'
  } else {
    errors.email = ''
  }
  return !errors.firstName && !errors.lastName && !errors.email
}

async function handleSubmit() {
  errors.general = ''
  if (!validate()) return
  try {
    isSubmitting.value = true
    const customer: Customer = await createCustomer({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      note: form.note || undefined
    })
    router.push(`/customers/${customer.id}`)
  } catch (err: any) {
    errors.general = err.message || 'Failed to create customer'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.error {
  color: red;
  display: block;
}
</style>

