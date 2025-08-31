<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconX, IconUpload, IconPlus, IconTrash } from '@tabler/icons-vue'
import MultiSelect from 'primevue/multiselect'
import { getCategories } from '../../../api/categories'
import { getCollections } from '../../../api/collections'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// Form data
const productData = ref({
  name: '',
  description: '',
  sku: '',
  price: '',
  images: [],
  status: 'draft', // draft, published
  categories: [],
  collections: [],
  variants: [
    { 
      title: 'Default', 
      options: [{ name: '', value: '' }],
      sku: '',
      price: '',
      inventory: '0' 
    }
  ]
})

// Available options for dropdowns
const availableCategories = ref<any[]>([])
const availableCollections = ref<any[]>([])

const loadOptions = async () => {
  try {
    const [categoriesRes, collectionsRes] = await Promise.all([
      getCategories(),
      getCollections()
    ])
    const categoryList = Array.isArray(categoriesRes)
      ? categoriesRes
      : (categoriesRes.categories || [])
    const collectionList = Array.isArray(collectionsRes)
      ? collectionsRes
      : (collectionsRes.collections || [])
    availableCategories.value = categoryList
    availableCollections.value = collectionList
  } catch (error) {
    console.error('Failed to load options', error)
  }
}

onMounted(loadOptions)

// Form tab state
const activeTab = ref('general')

// Methods
const setActiveTab = (tab: string) => {
  activeTab.value = tab
}

const addVariant = () => {
  productData.value.variants.push({
    title: `Variant ${productData.value.variants.length + 1}`,
    options: [{ name: '', value: '' }],
    sku: '',
    price: '',
    inventory: '0'
  })
}

const removeVariant = (index: number) => {
  productData.value.variants.splice(index, 1)
}

const addOption = (variantIndex: number) => {
  productData.value.variants[variantIndex].options.push({ name: '', value: '' })
}

const removeOption = (variantIndex: number, optionIndex: number) => {
  productData.value.variants[variantIndex].options.splice(optionIndex, 1)
}

const handleSave = () => {
  emit('save', productData.value)
  emit('close')
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Create New Product</h2>
        <button @click="handleClose" class="close-btn">
          <IconX :size="20" />
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Tabs -->
        <div class="tabs">
          <button 
            @click="setActiveTab('general')" 
            :class="['tab', { 'active': activeTab === 'general' }]"
          >
            General
          </button>
          <button 
            @click="setActiveTab('variants')" 
            :class="['tab', { 'active': activeTab === 'variants' }]"
          >
            Variants
          </button>
          <button 
            @click="setActiveTab('organization')" 
            :class="['tab', { 'active': activeTab === 'organization' }]"
          >
            Organization
          </button>
        </div>
        
        <div class="tab-content">
          <!-- General Tab -->
          <div v-show="activeTab === 'general'" class="form-section">
            <div class="form-group">
              <label for="product-name">Product Name</label>
              <input 
                type="text"
                id="product-name"
                v-model="productData.name"
                placeholder="Enter product name"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="product-description">Description</label>
              <textarea
                id="product-description"
                v-model="productData.description"
                placeholder="Describe the product"
                class="form-textarea"
                rows="4"
              ></textarea>
            </div>
            
            <div class="grid-2">
              <div class="form-group">
                <label for="product-sku">SKU</label>
                <input 
                  type="text"
                  id="product-sku"
                  v-model="productData.sku"
                  placeholder="Enter SKU"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="product-price">Base Price</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input 
                    type="text"
                    id="product-price"
                    v-model="productData.price"
                    placeholder="0.00"
                    class="form-input price-input"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>Images</label>
              <div class="images-container">
                <button class="image-upload-btn">
                  <IconUpload :size="18" />
                  <span>Upload Images</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Variants Tab -->
          <div v-show="activeTab === 'variants'" class="form-section">
            <div v-for="(variant, variantIndex) in productData.variants" :key="variantIndex" class="variant-card">
              <div class="variant-header">
                <h3 class="variant-title">{{ variant.title }}</h3>
                <button v-if="variantIndex !== 0" @click="removeVariant(variantIndex)" class="remove-btn">
                  <IconTrash :size="16" />
                </button>
              </div>
              
              <div class="grid-2">
                <div class="form-group">
                  <label :for="'variant-sku-' + variantIndex">SKU</label>
                  <input 
                    type="text"
                    :id="'variant-sku-' + variantIndex"
                    v-model="variant.sku"
                    placeholder="Enter SKU"
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label :for="'variant-price-' + variantIndex">Price</label>
                  <div class="input-with-prefix">
                    <span class="input-prefix">$</span>
                    <input 
                      type="text"
                      :id="'variant-price-' + variantIndex"
                      v-model="variant.price"
                      placeholder="0.00"
                      class="form-input price-input"
                    />
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label :for="'variant-inventory-' + variantIndex">Inventory Quantity</label>
                <input 
                  type="number"
                  :id="'variant-inventory-' + variantIndex"
                  v-model="variant.inventory"
                  min="0"
                  class="form-input"
                />
              </div>
              
              <div class="options-section">
                <h4>Options</h4>
                <div v-for="(option, optionIndex) in variant.options" :key="optionIndex" class="option-row">
                  <div class="option-inputs">
                    <input 
                      type="text" 
                      v-model="option.name" 
                      placeholder="Option name (e.g. Color)" 
                      class="form-input"
                    />
                    <input 
                      type="text" 
                      v-model="option.value" 
                      placeholder="Value (e.g. Red)" 
                      class="form-input"
                    />
                  </div>
                  <button 
                    v-if="variant.options.length > 1" 
                    @click="removeOption(variantIndex, optionIndex)" 
                    class="remove-option-btn"
                  >
                    <IconTrash :size="16" />
                  </button>
                </div>
                <button @click="addOption(variantIndex)" class="add-option-btn">
                  <IconPlus :size="14" />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
            
            <button @click="addVariant" class="add-variant-btn">
              <IconPlus :size="16" />
              <span>Add Another Variant</span>
            </button>
          </div>
          
          <!-- Organization Tab -->
          <div v-show="activeTab === 'organization'" class="form-section">
            <div class="form-group">
              <label for="product-status">Status</label>
              <select id="product-status" v-model="productData.status" class="form-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="product-categories">Categories</label>
              <MultiSelect
                id="product-categories"
                v-model="productData.categories"
                :options="availableCategories"
                optionLabel="name"
                optionValue="id"
                filter
                display="chip"
                placeholder="Select Categories"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <label for="product-collections">Collections</label>
              <MultiSelect
                id="product-collections"
                v-model="productData.collections"
                :options="availableCollections"
                optionLabel="name"
                optionValue="id"
                filter
                display="chip"
                placeholder="Select Collections"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="handleClose" class="btn secondary">Cancel</button>
        <button @click="handleSave" class="btn primary">Create Product</button>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 700px;
  max-width: 90%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.tab {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #111827;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
}

.price-input {
  padding-left: 1.5rem;
}

.images-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.image-upload-btn {
  width: 100px;
  height: 100px;
  border: 1px dashed #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.75rem;
  gap: 0.5rem;
  cursor: pointer;
}

.image-upload-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}

.variant-card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.variant-title {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.options-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.options-section h4 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.75rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.option-inputs {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.remove-option-btn,
.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.remove-option-btn:hover,
.remove-btn:hover {
  background-color: #fee2e2;
}

.add-option-btn,
.add-variant-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
}

.add-option-btn:hover,
.add-variant-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
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
</style>
