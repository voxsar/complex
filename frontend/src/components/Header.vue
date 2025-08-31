<template>
  <header id="sns_header" class="wrap">
    <div id="sns_header_logo">
      <RouterLink to="/" id="logo">
        <img :src="logo" alt="E-Shop logo" />
      </RouterLink>
    </div>
    <Navigation />
  </header>
</template>

<script setup>
import Navigation from './Navigation.vue';
import { RouterLink } from 'vue-router';

const logo = new URL('../assets/images/logo.jpg', import.meta.url).href;
</script>

<style scoped>
#sns_header {
  border-bottom: 1px solid #e5e5e5;
}
#sns_header_logo {
  padding: 1rem 0;
  text-align: center;
}
#logo img {
  max-height: 60px;
}
</style>
