<template>
  <div class="products-container">
    <!-- Header with actions -->
    <div class="header-actions">
      <h1 class="page-title">Products</h1>
      <div class="action-buttons">
        <button class="btn secondary">Export</button>
        <button class="btn secondary">Import</button>
        <button @click="openCreateModal" class="btn primary">Create</button>
      </div>
    </div>
    
    <!-- Product Create Modal -->
    <ProductCreateModal 
      :isOpen="isCreateModalOpen"
      @close="closeCreateModal"
      @save="handleCreateProduct"
    />

    <!-- Filter and Search -->
    <div class="filter-row">
      <button class="filter-btn">
        <IconFilter :size="16" />
        <span>Add filter</span>
      </button>

      <div class="search-container">
        <IconSearch :size="16" class="search-icon" />
        <input type="text" placeholder="Search" class="search-input" />
        <button class="view-options-btn">
          <IconListDetails :size="16" />
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="products-table">
      <table>
        <thead>
          <tr>
            <th class="checkbox-column">
              <input type="checkbox" />
            </th>
            <th>Product</th>
            <th>Collection</th>
            <th>Sales Channels</th>
            <th>Variants</th>
            <th>Status</th>
            <th class="action-column"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="checkbox-column">
              <input type="checkbox" />
            </td>
            <td>
              <div class="product-cell">
                <router-link :to="`/products/${product.id}`" class="product-link">
                  <img 
                    :src="createImagePlaceholder(product.name)" 
                    :alt="product.name" 
                    class="product-thumbnail" 
                  />
                  <span class="product-name">{{ product.name }}</span>
                </router-link>
              </div>
            </td>
            <td>{{ product.collection }}</td>
            <td>
              <div class="channels-cell">
                {{ product.salesChannels.join(', ') }}
                <span v-if="product.additionalChannels > 0" class="additional-channels">
                  + {{ product.additionalChannels }} more
                </span>
              </div>
            </td>
            <td>{{ product.variants }} {{ product.variants === 1 ? 'variant' : 'variants' }}</td>
            <td>
              <span class="status-badge">
                <span class="status-dot"></span>
                {{ product.status }}
              </span>
            </td>
            <td class="action-column">
              <button class="action-btn">
                <IconDotsVertical :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IconFilter,
  IconSearch,
  IconDotsVertical,
  IconListDetails
} from '@tabler/icons-vue'
import ProductCreateModal from './components/ProductCreateModal.vue'
import { getProducts, createProduct as createProductApi } from '../../api/products'

// Modal state
const isCreateModalOpen = ref(false)

// Modal functions
const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

interface ProductItem {
  id: string
  thumbnail?: string
  name: string
  collection: string
  salesChannels: string[]
  additionalChannels: number
  variants: number
  status: string
}

const products = ref<ProductItem[]>([])

const fetchProducts = async () => {
  try {
    const data = await getProducts()
    products.value = data.products.map((p: any) => ({
      id: p.id,
      thumbnail: p.thumbnail || '',
      name: p.title,
      collection: '', // TODO: map collection names
      salesChannels: p.salesChannels || [],
      additionalChannels: 0,
      variants: p.variants ? p.variants.length : 0,
      status: p.status === 'active' ? 'Published' : p.status
    }))
  } catch (error) {
    console.error('Failed to load products', error)
  }
}

onMounted(fetchProducts)

const handleCreateProduct = async (productData: any) => {
  try {
    const payload = {
      title: productData.name,
      description: productData.description,
      status: productData.status === 'published' ? 'active' : 'draft',
      variants: productData.variants.map((v: any) => ({
        title: v.title,
        sku: v.sku,
        price: Number(v.price) || 0,
        inventory: { quantity: Number(v.inventory) || 0 },
        options: v.options.map((o: any) => ({
          optionName: o.name,
          valueName: o.value
        }))
      })),
      collectionIds: productData.collections,
      categoryIds: productData.categories
    }

    const created = await createProductApi(payload)
    const newProduct: ProductItem = {
      id: created.id,
      thumbnail: created.thumbnail || '',
      name: created.title,
      collection: '',
      salesChannels: [],
      additionalChannels: 0,
      variants: created.variants ? created.variants.length : 0,
      status: created.status === 'active' ? 'Published' : created.status
    }
    products.value.unshift(newProduct)
  } catch (error) {
    console.error('Failed to create product', error)
  }
}

// Create placeholders for missing images
const createImagePlaceholder = (name: string): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e5e7eb&color=374151&size=60`
}
</script>

<style scoped>
.products-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn.primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn.primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn.secondary {
  background-color: white;
  color: #374151;
}

.btn.secondary:hover {
  background-color: #f9fafb;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
}

.filter-btn:hover {
  background-color: #f9fafb;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
}

.search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 100%;
}

.view-options-btn {
  margin-left: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.products-table {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f9fafb;
  position: sticky;
  top: 0;
}

th, td {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

th {
  color: #6b7280;
  font-weight: 500;
}

td {
  color: #111827;
}

.checkbox-column {
  width: 40px;
}

.action-column {
  width: 40px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  object-fit: cover;
}

.product-name {
  font-weight: 500;
}

.product-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.product-link:hover .product-name {
  color: #3b82f6;
  text-decoration: underline;
}

.channels-cell {
  max-width: 250px;
}

.additional-channels {
  color: #6b7280;
  font-size: 0.75rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #10b981;
  border-radius: 50%;
}

.action-btn {
  border: none;
  background: transparent;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  cursor: pointer;
}

.action-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}
</style>
