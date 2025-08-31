<template>
  <div>
    <h1>Customer Wishlist</h1>
    <div>
      <input v-model="newProductId" placeholder="Product ID" />
      <button @click="addItem">Add</button>
    </div>
    <ul>
      <li v-for="product in products" :key="product.id">
        {{ product.title || product.id }}
        <button @click="removeItem(product.id)">Remove</button>
        <button @click="transferToOrder(product.id)">Transfer to Order</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import httpClient from '../../api/httpClient'
import { getCustomerWishlist, addWishlistItem, removeWishlistItem, transferWishlistItemToOrder, Wishlist } from '../../api/customers'

const route = useRoute()
const customerId = route.params.id as string
const wishlist = ref<Wishlist>({ id: '', customerId, productIds: [] })
const products = ref<any[]>([])
const newProductId = ref('')

async function fetchWishlist() {
  const response = await getCustomerWishlist(customerId)
  wishlist.value = response.data
  products.value = await Promise.all(
    wishlist.value.productIds.map(async (id) => {
      try {
        return await httpClient.get<any>(`/products/${id}`)
      } catch {
        return { id, title: id }
      }
    })
  )
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

async function transferToOrder(id: string) {
  await transferWishlistItemToOrder(customerId, id)
  await fetchWishlist()
}

onMounted(fetchWishlist)
</script>
