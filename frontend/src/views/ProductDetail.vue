<template>

  <div class="product-view sns-product-detail">
    <ProductGallery :images="images" />
    <ProductInfo :product="product" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';

const placeholder = new URL('@/assets/images/placehoder.jpg', import.meta.url).href;
const images = ref([
  placeholder,
  placeholder,
  placeholder,
]);

onMounted(() => {
  new Swiper('.product-swiper', {
    modules: [Navigation, Pagination],
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
});
</script>

<style scoped>
.product-detail {
  max-width: 600px;
  margin: 0 auto;
}
.product-swiper {
  width: 100%;
  height: 300px;
  margin-bottom: 1rem;
}
.product-swiper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
