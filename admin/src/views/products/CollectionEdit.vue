<template>
  <div class="edit-collection">
    <h2>Edit Collection</h2>
    <p>Update your collection details.</p>

    <form @submit.prevent="saveCollection">
      <div class="form-group">
        <label for="title">Title</label>
        <input
          id="title"
          type="text"
          v-model="collectionForm.title"
          class="form-control"
          required
        />
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
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Collection</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCollection } from '../../api/collections';

const router = useRouter();
const route = useRoute();

const collectionForm = ref({
  title: '',
  handle: ''
});

onMounted(async () => {
  try {
    const id = route.params.id as string;
    const data = await getCollection(id);
    const c = data.collection;
    collectionForm.value = {
      title: c.title,
      handle: c.slug
    };
  } catch (error) {
    console.error('Failed to load collection:', error);
  }
});

const saveCollection = async () => {
  try {
    // TODO: Implement API call to update collection
    console.log('Saving collection:', collectionForm.value);
    router.push('/products/collections');
  } catch (error) {
    console.error('Failed to save collection:', error);
  }
};

const cancel = () => {
  router.push('/products/collections');
};
</script>

<style scoped>
.edit-collection {
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
</style>
