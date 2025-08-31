<template>
  <nav class="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/listing">Listing</RouterLink>
    <RouterLink to="/product">Product</RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.nav {
  display: flex;
  gap: 1rem;
}
</style>
