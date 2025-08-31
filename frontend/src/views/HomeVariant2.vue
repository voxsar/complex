<template>
  <div>
    <Header />
    <div id="sns_slideshow2">
      <div id="header-slideshow">
        <div class="row">
          <div class="slideshows col-md-8 col-sm-8">
            <Swiper :slides-per-view="1" :loop="true" class="home-variant2-swiper">
              <SwiperSlide v-for="src in slides" :key="src">
                <img :src="src" alt="" />
              </SwiperSlide>
            </Swiper>
          </div>
          <div class="banner-right col-md-4 col-sm-4">
            <div class="banner6 pdno col-md-12 col-sm-12">
              <a href="#">
                <img :src="bannerRight1" alt="" />
              </a>
            </div>
            <div class="banner7 banner6 banner5 col-md-12 col-sm-12">
              <a href="#">
                <img :src="bannerRight2" alt="" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';

const slides = [
  new URL('@/assets/images/slideshow1.jpg', import.meta.url).href,
  new URL('@/assets/images/slideshow2.jpg', import.meta.url).href,
  new URL('@/assets/images/slideshow3.jpg', import.meta.url).href,
];

const bannerRight1 = new URL('@/assets/images/banner3.jpg', import.meta.url).href;
const bannerRight2 = new URL('@/assets/images/slideshow222.jpg', import.meta.url).href;
</script>

<style scoped lang="less">
@import '@/assets/less/home.less';

.home-variant2-swiper {
  width: 100%;
  height: 300px;
}

.home-variant2-swiper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
