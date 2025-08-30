<template>
  <div>
    <h1>Customer Wishlist</h1>
    <div>
      <input v-model="newProductId" placeholder="Product ID" />
      <button @click="addItem">Add</button>
    </div>
    <ul>
      <li v-for="id in wishlist.productIds" :key="id">
        {{ id }}
        <button @click="removeItem(id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerWishlist, addWishlistItem, removeWishlistItem, Wishlist } from '../../api/customers'

const route = useRoute()
const customerId = route.params.id as string
const wishlist = ref<Wishlist>({ id: '', customerId, productIds: [] })
const newProductId = ref('')

async function fetchWishlist() {
  const response = await getCustomerWishlist(customerId)
  wishlist.value = response.data
}

async function addItem() {
  if (!newProductId.value) return
  await addWishlistItem(customerId, newProductId.value)
  newProductId.value = ''
  await fetchWishlist()
}

async function removeItem(id: string) {
  await removeWishlistItem(customerId, id)
  await fetchWishlist()
}

onMounted(fetchWishlist)
</script>
