<template>
  <div>
    <h1>Customer Detail</h1>
    <RouterLink :to="`/customers/${customerId}/wishlist`">View Wishlist</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const customerId = route.params.id as string
</script>
