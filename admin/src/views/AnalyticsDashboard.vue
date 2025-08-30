<template>
  <div class="analytics-dashboard">
    <h1>Analytics Dashboard</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else>
      <!-- Summary Stats -->
      <div class="stats">
        <div class="stat-card">
          <h3>Total Products</h3>
          <p>{{ dashboard.totalProducts }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Orders</h3>
          <p>{{ dashboard.totalOrders }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Customers</h3>
          <p>{{ dashboard.totalCustomers }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <p>{{ formatCurrency(dashboard.totalRevenue) }}</p>
        </div>
      </div>

      <!-- Sales Chart -->
      <div class="section">
        <h2>Sales (Last 30 Days)</h2>
        <Chart
          v-if="sales.length"
          type="line"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else>No sales data available</div>
      </div>

      <!-- Top Products -->
      <div class="section">
        <h2>Top Products</h2>
        <table class="top-products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Sales</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in topProducts" :key="p.id">
              <td>{{ p.title }}</td>
              <td>{{ p.sales }}</td>
              <td>{{ formatCurrency(p.revenue) }}</td>
            </tr>
            <tr v-if="topProducts.length === 0">
              <td colspan="3">No product data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Customer Stats -->
      <div class="section">
        <h2>Customers</h2>
        <ul>
          <li>New Customers: {{ customers.newCustomers }}</li>
          <li>Returning Customers: {{ customers.returningCustomers }}</li>
          <li>Average Order Value: {{ formatCurrency(customers.averageOrderValue) }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Chart from 'primevue/chart'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
}

interface SalesEntry {
  date: string
  sales: number
  orders: number
}

interface TopProduct {
  id: string
  title: string
  sales: number
  revenue: number
}

interface CustomerStats {
  newCustomers: number
  returningCustomers: number
  averageOrderValue: number
}

const dashboard = ref<DashboardStats>({
  totalProducts: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalRevenue: 0
})
const sales = ref<SalesEntry[]>([])
const topProducts = ref<TopProduct[]>([])
const customers = ref<CustomerStats>({
  newCustomers: 0,
  returningCustomers: 0,
  averageOrderValue: 0
})

const loading = ref(true)
const error = ref('')

onMounted(() => {
  fetchAll()
})

async function fetchAll() {
  try {
    await Promise.all([
      fetchDashboard(),
      fetchSales(),
      fetchTopProducts(),
      fetchCustomers()
    ])
  } catch (err: any) {
    error.value = err.message || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

async function fetchDashboard() {
  const res = await fetch('/api/analytics/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  dashboard.value = await res.json()
}

async function fetchSales() {
  const res = await fetch('/api/analytics/sales')
  if (!res.ok) throw new Error('Failed to fetch sales data')
  const data = await res.json()
  sales.value = data.data || []
}

async function fetchTopProducts() {
  const res = await fetch('/api/analytics/top-products')
  if (!res.ok) throw new Error('Failed to fetch top products')
  topProducts.value = await res.json()
}

async function fetchCustomers() {
  const res = await fetch('/api/analytics/customers')
  if (!res.ok) throw new Error('Failed to fetch customer stats')
  customers.value = await res.json()
}

const chartData = computed(() => ({
  labels: sales.value.map(s => s.date),
  datasets: [
    {
      label: 'Sales',
      data: sales.value.map(s => s.sales),
      fill: false,
      borderColor: '#42A5F5',
      tension: 0.4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    }
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<style scoped>
.analytics-dashboard {
  padding: 1rem;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  flex: 1;
  background: #fff;
  padding: 1rem;
  border: 1px solid #ddd;
  text-align: center;
}

.section {
  margin-top: 2rem;
}

.top-products-table {
  width: 100%;
  border-collapse: collapse;
}

.top-products-table th,
.top-products-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}
</style>

