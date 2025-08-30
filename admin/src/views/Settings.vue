<template>
  <div>
    <h1>Settings</h1>
    <nav class="settings-nav">
      <router-link to="/settings/payments">Payments</router-link>
      <router-link to="/settings/payment-intents">Payment Intents</router-link>
      <router-link to="/settings/refunds">Refunds</router-link>
      <router-link to="/settings/roles">Roles</router-link>
      <router-link to="/settings/sales-channels">Sales Channels</router-link>
      <router-link to="/settings/saved-payment-methods">Saved Payment Methods</router-link>
      <router-link to="/settings/shipments">Shipments</router-link>
      <router-link to="/settings/shipping-providers">Shipping Providers</router-link>
      <router-link to="/settings/shipping-rates">Shipping Rates</router-link>
      <router-link to="/settings/shipping-zones">Shipping Zones</router-link>
      <router-link to="/settings/tax-regions">Tax Regions</router-link>
      <router-link to="/settings/users">Users</router-link>
      <router-link to="/settings/webhooks">Webhooks</router-link>
    </nav>
    <router-view />
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <nav>
        <ul>
          <li><router-link to="/settings/api-keys">API Keys</router-link></li>
        </ul>
      </nav>
    </aside>
    <main class="settings-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// Settings parent view
</script>

<style scoped>
.settings-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.settings-nav a {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
}

.settings-nav a.router-link-active {
  background-color: #f3f4f6;
.settings-layout {
  display: flex;
  gap: 1rem;
}

.settings-sidebar {
  width: 200px;
}

.settings-content {
  flex: 1;
}
</style>
