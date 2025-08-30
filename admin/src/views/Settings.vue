<template>
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
