<template>
  <div class="categories-list">
    <div class="header">
      <div class="title-section">
        <h1>Categories</h1>
        <p>Organize products into categories, and manage those categories' ranking and hierarchy.</p>
      </div>
      <div class="actions">
        <button class="btn-secondary" @click="editRanking">Edit ranking</button>
        <button class="btn-primary" @click="navigateToCreate">Create</button>
      </div>
    </div>

    <div class="search-container">
      <input type="text" placeholder="Search" class="search-input" v-model="searchQuery" />
      <button class="btn-search">
        <span class="search-icon">🔍</span>
      </button>
    </div>

    <table class="categories-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Handle</th>
          <th>Status</th>
          <th>Visibility</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="category in categories" :key="category.id">
          <td>{{ category.name }}</td>
          <td>/{{ category.handle }}</td>
          <td>
            <span class="status-indicator" :class="{ 'active': category.status === 'Active' }"></span>
            {{ category.status }}
          </td>
          <td>
            <span class="visibility-indicator" :class="{ 'public': category.visibility === 'Public' }"></span>
            {{ category.visibility }}
          </td>
          <td class="actions-cell">
            <button class="btn-edit" @click="editCategory(category.id)">Edit</button>
            <button class="btn-delete" @click="deleteCategory(category.id)">Delete</button>
          </td>
        </tr>
        <tr v-if="categories.length === 0">
          <td colspan="5" class="empty-state">No categories found</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <div class="pagination-info">
        1 — {{ categories.length }} of {{ categories.length }} results
      </div>
      <div class="pagination-controls">
        <span>1 of 1 pages</span>
        <button class="btn-page" :disabled="currentPage === 1">Prev</button>
        <button class="btn-page" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCategories, deleteCategory as deleteCategoryApi } from '../../api/categories';

const router = useRouter();
const searchQuery = ref('');
interface CategoryItem {
  id: string;
  name: string;
  handle: string;
  status: string;
  visibility: string;
}

const categories = ref<CategoryItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);

onMounted(async () => {
  await fetchCategories();
});

const fetchCategories = async () => {
  try {
    const data = await getCategories();
    const list = Array.isArray(data) ? data : data.categories;
    categories.value = (list || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.slug,
      status: c.isActive ? 'Active' : 'Inactive',
      visibility: c.visibility || 'Private'
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

const navigateToCreate = () => {
  router.push('/products/categories/create');
};

const editRanking = () => {
  // TODO: Implement edit ranking functionality
  console.log('Edit ranking clicked');
};

const editCategory = (id: string) => {
  router.push(`/products/categories/create?id=${id}`);
};

const deleteCategory = async (id: string) => {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    await deleteCategoryApi(id);
    categories.value = categories.value.filter(c => c.id !== id);
  } catch (error) {
    console.error('Failed to delete category:', error);
  }
};
</script>

<style scoped>
.categories-list {
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

.actions {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 8px 16px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.search-container {
  position: relative;
  margin-bottom: 15px;
  width: 100%;
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

.categories-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.categories-table th, 
.categories-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.categories-table th {
  font-weight: 500;
  color: #333;
}

.status-indicator,
.visibility-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: #ccc;
}

.status-indicator.active,
.visibility-indicator.public {
  background-color: #4caf50;
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-edit {
  color: #4a6cf7;
}

.btn-delete {
  color: #dc2626;
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
</style>
