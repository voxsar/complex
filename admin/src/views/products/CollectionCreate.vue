<template>
  <div class="create-collection">
    <h2>Create Collection</h2>
    <p>Create a new collection to organize your products.</p>

    <form @submit.prevent="createCollection">
      <div class="form-group">
        <label for="title">Title</label>
        <input
          id="title"
          type="text"
          v-model="collectionForm.title"
          class="form-control"
          @blur="touched.title = true; validateTitle()"
          :class="{ invalid: errors.title }"
        />
        <div v-if="errors.title" class="error">{{ errors.title }}</div>
      </div>

      <div class="form-group">
        <label for="handle">
          Handle
          <span class="info-icon" title="Optional unique identifier for the collection">ⓘ</span>
          <span class="optional">(Optional)</span>
        </label>
        <div class="handle-input">
          <span class="handle-prefix">/</span>
          <input
            id="handle"
            type="text"
            v-model="collectionForm.handle"
            class="form-control"
            placeholder=""
            @blur="touched.handle = true; validateHandle()"
            :class="{ invalid: errors.handle }"
          />
        </div>
        <div v-if="errors.handle" class="error">{{ errors.handle }}</div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Collection' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createCollection as createCollectionApi, getCollections } from '../../api/collections';

const router = useRouter();

const collectionForm = ref({
  title: '',
  handle: ''
});

const errors = ref({
  title: '',
  handle: ''
});

const touched = ref({
  title: false,
  handle: false
});

const existingHandles = ref<string[]>([]);

onMounted(async () => {
  try {
    const data = await getCollections();
    existingHandles.value = data.collections.map((c: any) => c.slug.toLowerCase());
  } catch (error) {
    console.error('Failed to fetch collections:', error);
  }
});

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const validateTitle = () => {
  errors.value.title = collectionForm.value.title.trim() ? '' : 'Title is required';
};

const validateHandle = () => {
  const h = collectionForm.value.handle.trim();
  if (!h) {
    errors.value.handle = '';
    return;
  }
  const slug = slugify(h);
  if (slug !== h) {
    errors.value.handle = 'Handle must be URL friendly';
    return;
  }
  if (existingHandles.value.includes(slug)) {
    errors.value.handle = 'Handle already in use';
    return;
  }
  errors.value.handle = '';
};

watch(() => collectionForm.value.title, () => {
  if (touched.value.title) validateTitle();
});

watch(() => collectionForm.value.handle, () => {
  if (touched.value.handle) validateHandle();
});

const isFormValid = computed(() => {
  return (
    collectionForm.value.title.trim() &&
    !errors.value.title &&
    !errors.value.handle
  );
});

const isSubmitting = ref(false);

const createCollection = async () => {
  touched.value.title = true;
  touched.value.handle = true;
  validateTitle();
  validateHandle();
  if (!isFormValid.value) return;

  try {
    isSubmitting.value = true;
    const payload = {
      title: collectionForm.value.title.trim(),
      handle: collectionForm.value.handle
        ? slugify(collectionForm.value.handle)
        : undefined
    };
    await createCollectionApi(payload);
    router.push('/products/collections');
  } catch (error) {
    console.error('Failed to create collection:', error);
    alert((error as any)?.message || 'Failed to create collection');
  } finally {
    isSubmitting.value = false;
  }
};

const cancel = () => {
  router.push('/products/collections');
};
</script>

<style scoped>
.create-collection {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
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
