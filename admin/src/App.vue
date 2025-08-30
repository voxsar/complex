<script setup lang="ts">
import { 
  IconPackage, 
  IconSettings, 
  IconShoppingCart, 
  IconUsers, 
  IconSpeakerphone,
  IconCurrencyDollar,
  IconChevronRight,
  IconSearch,
  IconStack,
  IconBell,
  IconChartBar
} from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const expandedMenus = ref<string[]>(['products'])

const toggleMenu = (menuKey: string) => {
  const index = expandedMenus.value.indexOf(menuKey)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(menuKey)
  }
}

const isMenuExpanded = (menuKey: string) => {
  return expandedMenus.value.includes(menuKey)
}

// Page descriptions based on route name
const routeDescriptions: Record<string, string> = {
  'Products': 'Manage your inventory items',
  'Inventory': 'Manage your inventory items',
  'Orders': 'Manage customer orders',
  'Customers': 'Manage your customers',
  'Promotions': 'Create and manage promotions',
  'PriceLists': 'Manage your price lists',
  'Analytics': 'View store analytics',
  'Settings': 'Configure your store settings'
}

// Computed property for current page description
const getPageDescription = computed(() => {
  if (route.name && typeof route.name === 'string') {
    return routeDescriptions[route.name] || ''
  }
  return ''
})
</script>

<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="store-logo">
          <div class="logo-letter">M</div>
        </div>
        <h3 class="store-name">Medusa Store</h3>
        <button class="menu-toggle">
          <IconChevronRight :size="16" />
        </button>
      </div>
      
      <div class="sidebar-content">
        <!-- Main Navigation -->
        <nav class="sidebar-nav">
          <!-- Search -->
          <div class="search-container">
            <router-link to="/search" class="menu-item">
              <IconSearch :size="18" />
              <span>Search</span>
              <span class="keyboard-shortcut">⌘K</span>
            </router-link>
          </div>

          <!-- Analytics -->
          <router-link to="/analytics" class="menu-item">
            <IconChartBar :size="18" />
            <span>Analytics</span>
          </router-link>

          <!-- Orders -->
          <router-link to="/orders" class="menu-item">
            <IconShoppingCart :size="18" />
            <span>Orders</span>
          </router-link>
          
          <!-- Products Menu -->
          <div class="menu-group">
            <button 
              @click="toggleMenu('products')" 
              class="menu-item menu-group-toggle"
              :class="{ 'expanded': isMenuExpanded('products') }"
            >
              <IconPackage :size="18" />
              <span>Products</span>
              <IconChevronRight 
                :size="16" 
                class="chevron"
                :class="{ 'rotated': isMenuExpanded('products') }"
              />
            </button>
            <div v-show="isMenuExpanded('products')" class="sub-menu">
              <router-link to="/products" class="sub-menu-item">
                <span>All Products</span>
              </router-link>
              <router-link to="/products/collections" class="sub-menu-item">
                <span>Collections</span>
              </router-link>
              <router-link to="/products/categories" class="sub-menu-item">
                <span>Categories</span>
              </router-link>
            </div>
          </div>

          <!-- Inventory -->
          <router-link to="/inventory" class="menu-item">
            <IconStack :size="18" />
            <span>Inventory</span>
          </router-link>
          
          <!-- Customers -->
          <router-link to="/customers" class="menu-item">
            <IconUsers :size="18" />
            <span>Customers</span>
          </router-link>
          
          <!-- Promotions -->
          <router-link to="/promotions" class="menu-item">
            <IconSpeakerphone :size="18" />
            <span>Promotions</span>
          </router-link>
          
          <!-- Price Lists -->
          <router-link to="/price-lists" class="menu-item">
            <IconCurrencyDollar :size="18" />
            <span>Price Lists</span>
          </router-link>
        </nav>
        
        <!-- Settings at the bottom -->
        <div class="sidebar-footer">
          <router-link to="/settings" class="menu-item settings-link">
            <IconSettings :size="18" />
            <span>Settings</span>
          </router-link>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-container">
      <!-- Top Header -->
      <header class="topbar">
        <div class="page-title">
          <h1>{{ route.name }}</h1>
          <p class="subtitle">{{ getPageDescription }}</p>
        </div>
        <div class="header-actions">
          <button class="notification-btn">
            <IconBell :size="18" />
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>
<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: #f8fafc;
}

/* Sidebar Styles */
.sidebar {
  width: 240px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.store-logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.logo-letter {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.store-name {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.menu-toggle {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #6b7280;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
}

.search-container {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-nav {
  padding: 0.5rem 0;
  flex-grow: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #6b7280;
  font-weight: 400;
  transition: all 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  font-size: 0.875rem;
  position: relative;
}

.menu-item:hover {
  background-color: #f9fafb;
  color: #111827;
}

.menu-item.router-link-active {
  color: #111827;
  font-weight: 500;
}

.menu-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #111827;
}

.menu-group-toggle {
  justify-content: space-between;
}

.menu-group-toggle.expanded {
  color: #111827;
  font-weight: 500;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(90deg);
}

.sub-menu {
  padding-left: 0.75rem;
}

.keyboard-shortcut {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.sub-menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  text-decoration: none;
  color: #6b7280;
  font-weight: 400;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
}

.sub-menu-item:hover {
  color: #111827;
  background-color: #f9fafb;
}

.sub-menu-item.router-link-active {
  color: #111827;
  font-weight: 500;
}

.sub-menu-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #111827;
}

.sidebar-footer {
  border-top: 1px solid #e5e7eb;
  padding: 0.5rem 0;
  margin-top: auto;
}

.settings-link {
  color: #6b7280;
}

/* Main Container */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fafafa;
}

/* Top Header */
.topbar {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 9999px;
  color: #6b7280;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

/* Content Area */
.content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: #fafafa;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 220px;
  }
  
  .content {
    padding: 1rem;
  }
}

@media (max-width: 640px) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
  }
  
  .sidebar-content {
    flex-direction: row;
  }
  
  .sidebar-nav {
    flex: 1;
  }
  
  .sidebar-footer {
    border-top: none;
    border-left: 1px solid #e5e7eb;
    padding: 0 0.5rem;
  }
}
</style>
