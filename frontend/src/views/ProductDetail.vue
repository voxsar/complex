<template>
  <div class="product-detail">
    <img :src="placeholder" alt="product" />
    <h2>Sample Product</h2>
    <p>This is a placeholder description for the product detail page.</p>
  </div>
</template>

<script setup>
const placeholder = new URL('@/assets/images/placehoder.jpg', import.meta.url).href;
</script>

<style scoped>
.product-detail {
  max-width: 600px;
  margin: 0 auto;
}
.product-detail img {
  width: 100%;
  margin-bottom: 1rem;
}
</style>
