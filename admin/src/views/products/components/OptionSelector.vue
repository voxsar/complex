<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconPlus, IconTrash } from '@tabler/icons-vue'

interface OptionValue {
  id: string
  value: string
}

interface ProductOption {
  id: string
  name: string
  values: OptionValue[]
}

interface SelectedOption {
  optionId: string
  optionName: string
  valueId: string
  valueName: string
}

const props = defineProps<{ modelValue: SelectedOption[] }>()
const emit = defineEmits(['update:modelValue'])

const availableOptions = ref<ProductOption[]>([])
const loading = ref(false)

const fetchOptions = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/product-options')
    if (res.ok) {
      const data = await res.json()
      availableOptions.value = data.options ?? []
    }
  } catch (err) {
    console.error('Failed to fetch product options', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOptions)

const addOption = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    { optionId: '', optionName: '', valueId: '', valueName: '' }
  ])
}

const removeOption = (index: number) => {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

const updateOption = (index: number, field: 'optionId' | 'valueId', value: string) => {
  const updated = [...props.modelValue]
  const current = { ...updated[index] }

  if (field === 'optionId') {
    const opt = availableOptions.value.find(o => o.id === value)
    current.optionId = value
    current.optionName = opt ? opt.name : ''
    current.valueId = ''
    current.valueName = ''
  } else if (field === 'valueId') {
    const opt = availableOptions.value.find(o => o.id === current.optionId)
    const val = opt?.values.find(v => v.id === value)
    current.valueId = value
    current.valueName = val ? val.value : ''
  }

  updated[index] = current
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="options-section">
    <h4>Options</h4>
    <div v-if="loading">Loading options...</div>
    <div v-else>
      <div v-for="(option, index) in modelValue" :key="index" class="option-row">
        <select
          class="form-select"
          v-model="option.optionId"
          @change="updateOption(index, 'optionId', option.optionId)"
        >
          <option value="">Select option</option>
          <option v-for="opt in availableOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }}
          </option>
        </select>
        <select
          class="form-select"
          v-model="option.valueId"
          @change="updateOption(index, 'valueId', option.valueId)"
        >
          <option value="">Select value</option>
          <option
            v-for="val in availableOptions.find(o => o.id === option.optionId)?.values || []"
            :key="val.id"
            :value="val.id"
          >
            {{ val.value }}
          </option>
        </select>
        <button
          v-if="modelValue.length > 1"
          @click="removeOption(index)"
          class="remove-option-btn"
          type="button"
        >
          <IconTrash :size="16" />
        </button>
      </div>
      <button @click="addOption" class="add-option-btn" type="button">
        <IconPlus :size="14" />
        <span>Add Option</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.option-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.option-row select {
  flex: 1;
}
.remove-option-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}
.add-option-btn {
  margin-top: 0.5rem;
  background: none;
  border: 1px dashed #d1d5db;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
</style>
