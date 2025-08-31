<template>
  <div>
    <h1>Settings</h1>
    <div class="settings-layout">
      <aside class="settings-sidebar">
        <nav>
          <ul>
            <li><router-link to="/settings/payments">Payments</router-link></li>
            <li><router-link to="/settings/payment-intents">Payment Intents</router-link></li>
            <li><router-link to="/settings/refunds">Refunds</router-link></li>
            <li><router-link to="/settings/roles">Roles</router-link></li>
            <li><router-link to="/settings/sales-channels">Sales Channels</router-link></li>
            <li><router-link to="/settings/saved-payment-methods">Saved Payment Methods</router-link></li>
            <li><router-link to="/settings/shipments">Shipments</router-link></li>
            <li><router-link to="/settings/shipping-providers">Shipping Providers</router-link></li>
            <li><router-link to="/settings/shipping-rates">Shipping Rates</router-link></li>
            <li><router-link to="/settings/shipping-zones">Shipping Zones</router-link></li>
            <li><router-link to="/settings/tax-regions">Tax Regions</router-link></li>
            <li><router-link to="/settings/users">Users</router-link></li>
            <li><router-link to="/settings/webhooks">Webhooks</router-link></li>
            <li><router-link to="/settings/api-keys">API Keys</router-link></li>
          </ul>
        </nav>
      </aside>
      <main class="settings-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Settings parent view acting as container for sub-routes
</script>

<style scoped>
.settings-layout {
  display: flex;
  gap: 1rem;
}

.settings-sidebar {
  width: 220px;
}

.settings-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.settings-sidebar li + li {
  margin-top: 0.5rem;
}

.settings-sidebar a.router-link-active {
  font-weight: bold;
}

.settings-content {
  flex: 1;
}
</style>
