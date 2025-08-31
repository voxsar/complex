<template>
  <div>
    <Swiper :slides-per-view="1" :loop="true" class="home-swiper">
      <SwiperSlide v-for="src in slides" :key="src">
        <img :src="src" class="slide-image" />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';

const slides = [
  new URL('@/assets/images/banner11.jpg', import.meta.url).href,
  new URL('@/assets/images/banner14.jpg', import.meta.url).href,
  new URL('@/assets/images/banner_right.jpg', import.meta.url).href,
];
</script>

<style scoped>
.home-swiper {
  width: 100%;
  height: 300px;
}
.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
