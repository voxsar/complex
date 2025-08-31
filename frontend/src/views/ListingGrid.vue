<template>
  <div class="grid">
    <div class="item" v-for="n in 6" :key="n">
      <img :src="placeholder" alt="product" />
      <p>Product {{ n }}</p>
    </div>
  </div>
</template>

<script setup>
const placeholder = new URL('@/assets/images/placehoder.jpg', import.meta.url).href;
</script>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.item {
  width: calc(33% - 1rem);
  text-align: center;
}
.item img {
  width: 100%;
}
</style>
