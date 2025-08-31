<template>
  <div>
    <h1>Customer Detail</h1>

    <form v-if="customer" @submit.prevent="saveCustomer">
      <section>
        <h2>Profile</h2>
        <div>
          <label>First Name</label>
          <input v-model="customer.firstName" @input="validateField('firstName')" />
          <span v-if="errors.firstName">{{ errors.firstName }}</span>
        </div>
        <div>
          <label>Last Name</label>
          <input v-model="customer.lastName" @input="validateField('lastName')" />
          <span v-if="errors.lastName">{{ errors.lastName }}</span>
        </div>
        <div>
          <label>Email</label>
          <input v-model="customer.email" @input="validateField('email')" />
          <span v-if="errors.email">{{ errors.email }}</span>
        </div>
        <div>
          <label>Phone</label>
          <input v-model="customer.phone" @input="validateField('phone')" />
          <span v-if="errors.phone">{{ errors.phone }}</span>
        </div>
      </section>

      <section>
        <h2>Notes</h2>
        <textarea v-model="customer.note" />
      </section>

      <p v-if="serverError">{{ serverError }}</p>
      <button type="submit" :disabled="!isFormValid">Save</button>
    </form>

    <section>
      <h2>Orders</h2>
      <ul>
        <li v-for="order in orders" :key="order.id">
          {{ order.orderNumber }} - {{ order.status }} - {{ order.total }}
        </li>
      </ul>
    </section>

    <RouterLink :to="`/customers/${customerId}/wishlist`">View Wishlist</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getCustomer, updateCustomer, getCustomerOrders, type Customer, type Order } from '../../api/customers'

const route = useRoute()
const customerId = route.params.id as string

const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])
const errors = ref<Record<string, string>>({})
const serverError = ref('')

function validateField(field: string) {
  if (!customer.value) return
  switch (field) {
    case 'firstName':
      errors.value.firstName = customer.value.firstName ? '' : 'First name is required'
      break
    case 'lastName':
      errors.value.lastName = customer.value.lastName ? '' : 'Last name is required'
      break
    case 'email':
      if (!customer.value.email) {
        errors.value.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.value.email)) {
        errors.value.email = 'Invalid email'
      } else {
        errors.value.email = ''
      }
      break
    case 'phone':
      if (customer.value.phone && !/^\+?[1-9]\d{1,14}$/.test(customer.value.phone)) {
        errors.value.phone = 'Invalid phone number'
      } else {
        errors.value.phone = ''
      }
      break
  }
}

function validateAll() {
  ['firstName', 'lastName', 'email', 'phone'].forEach(validateField)
}

const isFormValid = computed(() => {
  if (!customer.value) return false
  return Object.values(errors.value).every((e) => !e)
})

async function fetchCustomer() {
  customer.value = await getCustomer(customerId)
  validateAll()
}

async function fetchOrders() {
  const res = await getCustomerOrders(customerId)
  orders.value = res.orders
}

async function saveCustomer() {
  if (!customer.value) return
  validateAll()
  if (!isFormValid.value) return
  serverError.value = ''
  try {
    await updateCustomer(customerId, {
      firstName: customer.value.firstName,
      lastName: customer.value.lastName,
      email: customer.value.email,
      phone: customer.value.phone,
      note: customer.value.note
    })
    await fetchCustomer()
  } catch (err: any) {
    serverError.value = err.message || 'Failed to update customer'
  }
}

onMounted(() => {
  fetchCustomer()
  fetchOrders()
})
</script>
