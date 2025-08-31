<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateProductOption, type ProductOption, type ProductOptionPayload } from '../../../api/product-options'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{ isOpen: boolean; option: ProductOption | null }>()
const emit = defineEmits(['close', 'saved'])

const INPUT_TYPES = ['select', 'radio', 'color', 'text'] as const

const form = ref<ProductOptionPayload>({
  name: '',
  displayName: '',
  inputType: 'select',
  isRequired: false
})
const error = ref('')
const toast = useToast()

const reset = () => {
  if (props.option) {
    form.value = {
      name: props.option.name,
      displayName: props.option.displayName || '',
      inputType: props.option.inputType,
      isRequired: props.option.isRequired
    }
  } else {
    form.value = { name: '', displayName: '', inputType: 'select', isRequired: false }
  }
  error.value = ''
}

watch(() => props.option, () => reset())

const handleSave = async () => {
  if (!props.option) return
  if (!form.value.name.trim()) {
    error.value = 'Name is required'
    return
  }
  if (!INPUT_TYPES.includes(form.value.inputType as typeof INPUT_TYPES[number])) {
    error.value = `Input type must be one of: ${INPUT_TYPES.join(', ')}`
    return
  }
  console.debug('Attempting to update product option', props.option.id, form.value)
  try {
    const res = await updateProductOption(props.option.id, {
      ...form.value,
      displayName: form.value.displayName || undefined
    })
    const option = (res as any).option ?? (res as ProductOption)
    const message = (res as any).message || 'Product option updated'
    console.debug('Product option updated', option)
    toast.add({ severity: 'success', summary: 'Success', detail: message })
    emit('saved', option)
    reset()
    emit('close')
  } catch (e: any) {
    const message = e.message || 'Failed to update option'
    console.debug('Product option update failed', e)
    error.value = message
    toast.add({ severity: 'error', summary: 'Error', detail: message })
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Edit Product Option</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="modal-content">
        <div v-if="error" class="error">{{ error }}</div>
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label>Display Name</label>
          <input v-model="form.displayName" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label>Input Type</label>
          <select v-model="form.inputType" class="form-input">
            <option value="select">Select</option>
            <option value="radio">Radio</option>
            <option value="color">Color</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div class="form-group checkbox">
          <label>
            <input type="checkbox" v-model="form.isRequired" />
            Required
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="handleSave">Save</button>
        <button class="btn secondary" @click="handleClose">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}
.modal-content {
  flex: 1;
}
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}
.form-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.error {
  color: red;
  margin-bottom: 0.5rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.btn.secondary {
  background-color: #6b7280;
}
</style>
