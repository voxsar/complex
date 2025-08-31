<template>
  <div class="p-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1>Price Lists</h1>
      <Button label="New Price List" icon="pi pi-plus" @click="openNew" />
    </div>
    <DataTable :value="priceLists" dataKey="id" responsiveLayout="scroll">
      <Column field="title" header="Title" />
      <Column field="type" header="Type" />
      <Column field="status" header="Status" />
      <Column header="Channels">
        <template #body="slotProps">
          {{ formatChannels(slotProps.data.salesChannelIds) }}
        </template>
      </Column>
      <Column header="Actions" style="width:8rem">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" @click="openEdit(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="remove(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" header="Price List" modal class="w-30rem">
      <div class="flex flex-column gap-2">
        <label for="title">Title</label>
        <InputText id="title" v-model="form.title" />

        <label for="description">Description</label>
        <Textarea id="description" v-model="form.description" autoResize />

        <label for="type">Type</label>
        <Dropdown id="type" v-model="form.type" :options="types" optionLabel="label" optionValue="value" />

        <label for="status">Status</label>
        <Dropdown id="status" v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" />

        <label for="channels">Sales Channels</label>
        <MultiSelect id="channels" v-model="form.salesChannelIds" :options="salesChannels" optionLabel="name" optionValue="id" display="chip" />
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="dialogVisible = false" />
        <Button label="Save" icon="pi pi-check" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import { getPriceLists, createPriceList, updatePriceList, deletePriceList, PriceList } from '../api/price-lists'
import { getSalesChannels, SalesChannel } from '../api/sales-channels'

interface PriceListForm {
  title: string
  description?: string
  type: string
  status: string
  salesChannelIds: string[]
}

const priceLists = ref<PriceList[]>([])
const salesChannels = ref<SalesChannel[]>([])
const dialogVisible = ref(false)
const editing = ref<PriceList | null>(null)
const form = ref<PriceListForm>({
  title: '',
  description: '',
  type: 'sale',
  status: 'draft',
  salesChannelIds: []
})

const types = [
  { label: 'Sale', value: 'sale' },
  { label: 'Override', value: 'override' }
]

const statuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

function formatChannels(ids: string[] = []) {
  return ids.map(id => {
    const channel = salesChannels.value.find(c => c.id === id)
    return channel ? channel.name : id
  }).join(', ')
}

function openNew() {
  editing.value = null
  form.value = {
    title: '',
    description: '',
    type: 'sale',
    status: 'draft',
    salesChannelIds: []
  }
  dialogVisible.value = true
}

function openEdit(priceList: PriceList) {
  editing.value = priceList
  form.value = {
    title: priceList.title,
    description: priceList.description,
    type: priceList.type,
    status: priceList.status,
    salesChannelIds: priceList.salesChannelIds || []
  }
  dialogVisible.value = true
}

async function save() {
  if (editing.value) {
    await updatePriceList(editing.value.id, form.value)
  } else {
    await createPriceList(form.value)
  }
  dialogVisible.value = false
  await fetchPriceLists()
}

async function remove(priceList: PriceList) {
  if (confirm('Delete this price list?')) {
    await deletePriceList(priceList.id)
    await fetchPriceLists()
  }
}

async function fetchPriceLists() {
  const res = await getPriceLists()
  priceLists.value = res.priceLists
}

async function fetchSalesChannels() {
  const res = await getSalesChannels()
  salesChannels.value = res.salesChannels
}

onMounted(async () => {
  await fetchSalesChannels()
  await fetchPriceLists()
})
</script>

<style scoped>
.w-30rem {
  width: 30rem;
}
</style>

