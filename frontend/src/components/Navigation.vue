<template>
  <nav id="sns_menu">
    <ul class="mainnav">
      <li class="level0"><RouterLink to="/">Home</RouterLink></li>
      <li class="level0"><RouterLink to="/listing">Listing</RouterLink></li>
      <li class="level0"><RouterLink to="/product">Product</RouterLink></li>
    </ul>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
#sns_menu {
  background: #333;
}
.mainnav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}
.mainnav li a {
  display: block;
  padding: 0.75rem 1rem;
  color: #fff;
  text-decoration: none;
}
.mainnav li a:hover {
  background: #444;
}
</style>
