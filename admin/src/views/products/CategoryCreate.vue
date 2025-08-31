<template>
  <div class="create-category">
    <h2>Create Category</h2>
    <p>Create a new category to organize your products.</p>

    <form @submit.prevent="createCategory">
      <div class="form-group">
        <label for="title">Title</label>
        <input
          id="title"
          type="text"
          v-model="categoryForm.title"
          class="form-control"
          @blur="touched.title = true; validateTitle()"
          :class="{ invalid: errors.title }"
        />
        <div v-if="errors.title" class="error">{{ errors.title }}</div>
      </div>

      <div class="form-group">
        <label for="handle">
          Handle
          <span class="info-icon" title="Optional unique identifier for the category">ⓘ</span>
          <span class="optional">(Optional)</span>
        </label>
        <div class="handle-input">
          <span class="handle-prefix">/</span>
          <input
            id="handle"
            type="text"
            v-model="categoryForm.handle"
            class="form-control"
            placeholder=""
            @blur="touched.handle = true; validateHandle()"
            :class="{ invalid: errors.handle }"
          />
        </div>
        <div v-if="errors.handle" class="error">{{ errors.handle }}</div>
      </div>

      <div class="form-group">
        <label for="description">
          Description
          <span class="optional">(Optional)</span>
        </label>
        <textarea 
          id="description" 
          v-model="categoryForm.description" 
          class="form-control text-area" 
          rows="5"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group half-width">
          <label for="status">Status</label>
          <select id="status" v-model="categoryForm.status" class="form-control">
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div class="form-group half-width">
          <label for="visibility">Visibility</label>
          <select id="visibility" v-model="categoryForm.visibility" class="form-control">
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Category' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import httpClient from '../../api/httpClient';

const router = useRouter();

const categoryForm = ref({
  title: '',
  handle: '',
  description: '',
  status: 'Active',
  visibility: 'Public'
});

const errors = ref({
  title: '',
  handle: ''
});

const touched = ref({
  title: false,
  handle: false
});

const isSubmitting = ref(false);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const validateTitle = () => {
  errors.value.title = categoryForm.value.title.trim() ? '' : 'Title is required';
};

const validateHandle = () => {
  const h = categoryForm.value.handle.trim();
  if (!h) {
    errors.value.handle = '';
    return;
  }
  errors.value.handle = slugRegex.test(h) ? '' : 'Handle must be URL friendly';
};

watch(() => categoryForm.value.title, () => {
  if (touched.value.title) validateTitle();
});

watch(() => categoryForm.value.handle, () => {
  if (touched.value.handle) validateHandle();
});

const isFormValid = computed(() => {
  return (
    categoryForm.value.title.trim() &&
    !errors.value.title &&
    !errors.value.handle
  );
});

const createCategory = async () => {
  touched.value.title = true;
  touched.value.handle = true;
  validateTitle();
  validateHandle();
  if (!isFormValid.value) return;

  const slug = categoryForm.value.handle
    ? slugify(categoryForm.value.handle)
    : slugify(categoryForm.value.title);

  const payload = {
    name: categoryForm.value.title.trim(),
    slug,
    description: categoryForm.value.description.trim() || undefined,
    isActive: categoryForm.value.status === 'Active',
    metadata: { visibility: categoryForm.value.visibility }
  };

  try {
    isSubmitting.value = true;
    console.debug('Starting category create request', payload);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      let message = 'Failed to create category';
      if (res.status === 409) {
        message = data.error || 'Category handle already exists';
      } else if (res.status === 400) {
        message = data.error || 'Invalid category data';
      } else if (data.error) {
        message = data.error;
      }
      throw new Error(message);

    }

    console.debug('Category create request succeeded');
    alert('Category created successfully');
    router.push('/products/categories');
  } catch (err: any) {
    console.debug('Category create request failed', err);
    alert(err.message || 'Failed to create category');
  } finally {
    console.debug('Category create request ended');
    isSubmitting.value = false;
  }
};

const cancel = () => {
  router.push('/products/categories');
};
</script>

<style scoped>
.create-category {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.half-width {
  width: 50%;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.text-area {
  resize: vertical;
  min-height: 100px;
}

.info-icon {
  color: #777;
  cursor: help;
}

.optional {
  color: #777;
  font-weight: normal;
  font-size: 0.9em;
}

.handle-input {
  display: flex;
  align-items: center;
}

.handle-prefix {
  padding: 8px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.handle-input .form-control {
  border-radius: 0 4px 4px 0;
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #4a6cf7;
  color: white;
  border: none;
}

.btn-secondary {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
}

.error {
  color: red;
  margin-top: 4px;
  font-size: 0.9em;
}

.invalid {
  border-color: red;
}
</style>
