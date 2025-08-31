<template>
  <div>
    <h1>Customer Detail</h1>

    <form v-if="customer" @submit.prevent="saveCustomer">
      <section>
        <h2>Profile</h2>
        <div>
          <label>First Name</label>
          <input v-model="customer.firstName" />
        </div>
        <div>
          <label>Last Name</label>
          <input v-model="customer.lastName" />
        </div>
        <div>
          <label>Email</label>
          <input v-model="customer.email" />
        </div>
        <div>
          <label>Phone</label>
          <input v-model="customer.phone" />
        </div>
      </section>

      <section>
        <h2>Notes</h2>
        <textarea v-model="customer.note" />
      </section>

      <button type="submit">Save</button>
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
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getCustomer, updateCustomer, getCustomerOrders, type Customer, type Order } from '../../api/customers'

const route = useRoute()
const customerId = route.params.id as string

const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])

async function fetchCustomer() {
  customer.value = await getCustomer(customerId)
}

async function fetchOrders() {
  const res = await getCustomerOrders(customerId)
  orders.value = res.orders
}

async function saveCustomer() {
  if (!customer.value) return
  await updateCustomer(customerId, {
    firstName: customer.value.firstName,
    lastName: customer.value.lastName,
    email: customer.value.email,
    phone: customer.value.phone,
    note: customer.value.note
  })
  await fetchCustomer()
}

onMounted(() => {
  fetchCustomer()
  fetchOrders()
})
</script>
