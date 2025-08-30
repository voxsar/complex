<script setup lang="ts">
import { ref } from 'vue'
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconDots,
  IconCheck,
  IconX
} from '@tabler/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Product data
const product = ref({
  id: '1',
  title: 'Medusa Sweatshirt',
  description: 'Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.',
  subtitle: '',
  handle: 'sweatshirt',
  discountable: true,
  status: 'published',
  thumbnail: 'https://ui-avatars.com/api/?name=Medusa+Sweatshirt&background=e5e7eb&color=374151&size=60',
  images: [
    { 
      id: '1', 
      url: 'https://ui-avatars.com/api/?name=MS&background=e5e7eb&color=374151&size=200',
      alt: 'Medusa Sweatshirt Front View'
    },
    { 
      id: '2', 
      url: 'https://ui-avatars.com/api/?name=MS&background=e5e7eb&color=374151&size=200', 
      alt: 'Medusa Sweatshirt Back View'
    }
  ],
  salesChannels: [
    { id: '1', name: 'Default Sales Channel' }
  ],
  shippingProfile: {
    id: '1',
    name: 'Default Shipping Profile',
    default: true
  },
  categories: ['Sweatshirts'],
  tags: [],
  type: null,
  collection: null,
  attributes: {
    height: null,
    width: null,
    length: null,
    weight: '400',
    midCode: null,
    hsCode: null,
    countryOfOrigin: null
  },
  variants: [
    { 
      id: '1',
      title: 'L',
      sku: 'SWEATSHIRT-L',
      size: 'L',
      inventory: 1000000,
      location: 'location',
      created: 'Aug 3, 2025',
      updated: 'Aug 3, 2025'
    },
    { 
      id: '2',
      title: 'M',
      sku: 'SWEATSHIRT-M',
      size: 'M',
      inventory: 1000000,
      location: 'location',
      created: 'Aug 3, 2025',
      updated: 'Aug 3, 2025'
    },
    { 
      id: '3',
      title: 'S',
      sku: 'SWEATSHIRT-S',
      size: 'S',
      inventory: 1000000,
      location: 'location',
      created: 'Aug 3, 2025',
      updated: 'Aug 3, 2025'
    },
    { 
      id: '4',
      title: 'XL',
      sku: 'SWEATSHIRT-XL',
      size: 'XL',
      inventory: 1000000,
      location: 'location',
      created: 'Aug 3, 2025',
      updated: 'Aug 3, 2025'
    }
  ],
  metadata: {
    keyCount: 0
  },
  json: {
    keyCount: 32
  }
})

// Active sizes in the size selector
const activeSizes = ref(['L', 'M', 'S', 'XL'])

// Pagination state for variants
const pagination = ref({
  current: 1,
  total: 1,
  totalItems: 4
})

const goBack = () => {
  router.push('/products')
}
</script>

<template>
  <div class="product-view">
    <!-- Header with navigation and actions -->
    <div class="product-header">
      <div class="navigation">
        <button @click="goBack" class="back-btn">
          <IconArrowLeft :size="18" />
          <span>Back to products</span>
        </button>
      </div>
      <div class="actions">
        <button class="btn secondary">
          <IconEdit :size="16" />
          <span>Edit</span>
        </button>
        <button class="btn danger">
          <IconTrash :size="16" />
          <span>Delete</span>
        </button>
      </div>
    </div>

    <!-- Product Title Section with Status -->
    <div class="product-title-section">
      <h1 class="product-title">{{ product.title }}</h1>
      <div class="status-badge published">
        <IconCheck :size="14" />
        <span>Published</span>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="product-content">
      <!-- Left Column - Product Details -->
      <div class="product-details">
        <!-- Description Card -->
        <div class="card">
          <div class="card-header">
            <h2>Description</h2>
          </div>
          <div class="card-content">
            <div class="form-field">
              <label>Description</label>
              <p>{{ product.description }}</p>
            </div>

            <div class="form-field">
              <label>Subtitle</label>
              <p v-if="product.subtitle">{{ product.subtitle }}</p>
              <p v-else class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Handle</label>
              <p>/{{ product.handle }}</p>
            </div>

            <div class="form-field">
              <label>Discountable</label>
              <p>{{ product.discountable ? 'True' : 'False' }}</p>
            </div>
          </div>
        </div>

        <!-- Media Card -->
        <div class="card">
          <div class="card-header">
            <h2>Media</h2>
          </div>
          <div class="card-content">
            <div class="image-gallery">
              <div v-for="image in product.images" :key="image.id" class="image-item">
                <img :src="image.url" :alt="image.alt" class="product-image" />
              </div>
            </div>
          </div>
        </div>

        <!-- Options Card -->
        <div class="card">
          <div class="card-header">
            <h2>Options</h2>
          </div>
          <div class="card-content">
            <div class="size-selector">
              <label>Size</label>
              <div class="size-options">
                <button 
                  v-for="size in ['L', 'M', 'S', 'XL']" 
                  :key="size"
                  :class="['size-option', { active: activeSizes.includes(size) }]"
                >
                  {{ size }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Variants Card -->
        <div class="card">
          <div class="card-header">
            <h2>Variants</h2>
            <div class="header-actions">
              <div class="search-box">
                <input type="text" placeholder="Search" class="search-input" />
              </div>
              <button class="action-btn">
                <IconDots :size="16" />
              </button>
            </div>
          </div>
          <div class="card-content">
            <div class="variants-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>SKU</th>
                    <th>Size</th>
                    <th>Inventory</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="variant in product.variants" :key="variant.id">
                    <td>{{ variant.title }}</td>
                    <td>{{ variant.sku }}</td>
                    <td>{{ variant.size }}</td>
                    <td>{{ variant.inventory.toLocaleString() }} available at 1 location</td>
                    <td>{{ variant.created }}</td>
                    <td>{{ variant.updated }}</td>
                    <td>
                      <button class="action-btn">
                        <IconDots :size="16" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span>1 – {{ product.variants.length }} of {{ product.variants.length }} results</span>
              <div class="pagination-controls">
                <span>{{ pagination.current }} of {{ pagination.total }} pages</span>
                <button class="pagination-btn" disabled>Prev</button>
                <button class="pagination-btn" disabled>Next</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Metadata Card -->
        <div class="card">
          <div class="card-header">
            <h2>Metadata</h2>
            <span class="badge">{{ product.metadata.keyCount }} keys</span>
          </div>
          <div class="card-content empty-content">
            <p>No metadata added yet</p>
          </div>
        </div>

        <!-- JSON Card -->
        <div class="card">
          <div class="card-header">
            <h2>JSON</h2>
            <span class="badge">{{ product.json.keyCount }} keys</span>
          </div>
          <div class="card-content json-content">
            <button class="btn secondary">
              <IconEdit :size="16" />
              <span>View and edit JSON</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column - Sidebar -->
      <div class="product-sidebar">
        <!-- Sales Channels Card -->
        <div class="card">
          <div class="card-header">
            <h2>Sales Channels</h2>
            <button class="action-btn">
              <IconDots :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="channel-item">
              <div class="channel-icon">
                <IconCheck :size="14" />
              </div>
              <div class="channel-name">
                Default Sales Channel
              </div>
            </div>
            <div class="card-footer">
              <p class="info-text">Available in 1 of 1 sales channels</p>
            </div>
          </div>
        </div>

        <!-- Shipping Configuration -->
        <div class="card">
          <div class="card-header">
            <h2>Shipping configuration</h2>
            <button class="action-btn">
              <IconDots :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="shipping-profile">
              <div class="profile-icon">
                <IconCheck :size="14" />
              </div>
              <div class="profile-details">
                <h3>Default Shipping Profile</h3>
                <span class="badge default">default</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Organize Card -->
        <div class="card">
          <div class="card-header">
            <h2>Organize</h2>
            <button class="action-btn">
              <IconDots :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="form-field">
              <label>Tags</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Type</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Collection</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Categories</label>
              <div class="category-tag">
                Sweatshirts
              </div>
            </div>
          </div>
        </div>

        <!-- Attributes Card -->
        <div class="card">
          <div class="card-header">
            <h2>Attributes</h2>
            <button class="action-btn">
              <IconDots :size="16" />
            </button>
          </div>
          <div class="card-content">
            <div class="form-field">
              <label>Height</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Width</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Length</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Weight</label>
              <p>400</p>
            </div>

            <div class="form-field">
              <label>MID code</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>HS code</label>
              <p class="empty-field">-</p>
            </div>

            <div class="form-field">
              <label>Country of origin</label>
              <p class="empty-field">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.back-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.actions {
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
  gap: 0.5rem;
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

.btn.danger {
  background-color: white;
  color: #ef4444;
  border-color: #fecaca;
}

.btn.danger:hover {
  background-color: #fef2f2;
}

.product-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.published {
  background-color: #ecfdf5;
  color: #10b981;
}

.status-badge.draft {
  background-color: #f3f4f6;
  color: #6b7280;
}

.product-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.product-details,
.product-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 200px;
}

.action-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.card-content {
  padding: 1rem 1.5rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.form-field p {
  margin: 0;
  font-size: 0.875rem;
  color: #111827;
}

.empty-field {
  color: #9ca3af !important;
}

.image-gallery {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.image-item {
  width: 80px;
  height: 80px;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.size-selector {
  margin-bottom: 0;
}

.size-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.size-option {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background-color: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.size-option.active {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.variants-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f9fafb;
}

th, td {
  text-align: left;
  padding: 0.75rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

th {
  color: #6b7280;
  font-weight: 500;
}

td {
  color: #111827;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pagination-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.badge {
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.default {
  background-color: #e5e7eb;
  color: #4b5563;
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.json-content {
  display: flex;
  justify-content: flex-start;
}

.channel-item,
.shipping-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.channel-icon,
.profile-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-details h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.info-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.category-tag {
  display: inline-block;
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
}
</style>
