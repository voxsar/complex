<template>
  <div id="sns_wrapper">
    <Header />
    <div id="sns_main" v-html="content"></div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import raw from '../../../website/index3-listing-list.html?raw';

const content = ref('');
onMounted(() => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  content.value = doc.querySelector('#sns_main')?.innerHTML || '';
});
</script>

<style scoped lang="less">
@import "../assets/less/variables.less";
@import "../assets/less/mixin.less";
@import "../assets/less/general.less";
@import "../assets/less/listing.less";
</style>
