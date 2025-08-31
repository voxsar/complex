<template>
  <div class="collections-list">
    <div class="header">
      <div class="title-section">
        <h1>Collections</h1>
        <p>Organize products into collections.</p>
      </div>
      <div class="actions">
        <button class="btn-create" @click="navigateToCreate">Create</button>
      </div>
    </div>

    <div class="filters">
      <button class="btn-filter">Add filter</button>
      <div class="search-container">
        <input type="text" placeholder="Search" class="search-input" v-model="searchQuery" />
        <button class="btn-search">
          <span class="search-icon">🔍</span>
        </button>
      </div>
      <button class="btn-view">
        <span class="view-icon">≡</span>
      </button>
    </div>

    <table class="collections-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Handle</th>
          <th>Products</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collection in collections" :key="collection.id">
          <td>
            <router-link :to="`/products/collections/${collection.id}`" class="collection-link">
              {{ collection.title }}
            </router-link>
          </td>
          <td>/{{ collection.handle }}</td>
          <td>{{ collection.productsCount || '-' }}</td>
          <td class="actions-cell">
            <button class="btn-menu" @click="navigateToEdit(collection.id)">⋯</button>
          </td>
        </tr>
        <tr v-if="collections.length === 0">
          <td colspan="4" class="empty-state">No collections found</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <div class="pagination-info">
        1 — {{ collections.length }} of {{ collections.length }} results
      </div>
      <div class="pagination-controls">
        <span>1 of 1 pages</span>
        <button class="btn-page" disabled>Prev</button>
        <button class="btn-page" disabled>Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCollections } from '../../api/collections';

const router = useRouter();
const searchQuery = ref('');
const collections = ref<Array<{
  id: string;
  title: string;
  handle: string;
  productsCount?: number;
}>>([]);

onMounted(async () => {
  await fetchCollections();
});

const fetchCollections = async () => {
  try {
    const data = await getCollections();
    collections.value = data.collections.map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.slug,
      productsCount: c.productIds ? c.productIds.length : 0
    }));
  } catch (error) {
    console.error('Failed to fetch collections:', error);
  }
};

const navigateToCreate = () => {
  router.push('/products/collections/create');
};

const navigateToEdit = (id: string) => {
  router.push(`/products/collections/${id}`);
};
</script>

<style scoped>
.collections-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-section h1 {
  margin: 0 0 8px 0;
}

.title-section p {
  margin: 0;
  color: #666;
}

.btn-create {
  padding: 8px 16px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;
}

.btn-filter {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.search-container {
  position: relative;
  flex-grow: 1;
  margin: 0 15px;
  display: flex;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-search {
  background: none;
  border: none;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.btn-view {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
}

.collections-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.collections-table th, 
.collections-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.collections-table th {
  font-weight: 500;
  color: #333;
}

.actions-cell {
  text-align: right;
}

.btn-menu {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-page {
  padding: 5px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.collection-link {
  color: inherit;
  text-decoration: none;
}

.collection-link:hover {
  text-decoration: underline;
}
</style>
