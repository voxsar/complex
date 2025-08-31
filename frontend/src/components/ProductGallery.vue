<template>
  <div class="product-img-box">
    <div class="detail-img">
      <img :src="images[0]" alt="main image" />
    </div>
    <div class="small-img">
      <img v-for="(img, i) in images.slice(1)" :key="i" :src="img" alt="thumbnail" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
});
</script>
