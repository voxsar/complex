<template>
  <div class="product-view sns-product-detail">
    <ProductGallery :images="images" />
    <ProductInfo :product="product" />
  </div>
</template>

<script setup>
import ProductGallery from '@/components/ProductGallery.vue';
import ProductInfo from '@/components/ProductInfo.vue';

const images = [
  new URL('@/assets/images/product-main.svg', import.meta.url).href,
  new URL('@/assets/images/product-thumb1.svg', import.meta.url).href,
  new URL('@/assets/images/product-thumb2.svg', import.meta.url).href,
  new URL('@/assets/images/product-thumb3.svg', import.meta.url).href,
  new URL('@/assets/images/product-thumb4.svg', import.meta.url).href
];

const product = {
  title: 'Modular Modern',
  price: '$ 540.00',
  availability: 'In stock',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vel magna quis risus commodo porttitor.'
};
</script>

<style src="../assets/detail.css"></style>
