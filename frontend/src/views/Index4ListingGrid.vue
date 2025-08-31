<template>
  <div>
    <Header />
    <div v-html="htmlContent"></div>
    <Footer />
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import raw from '../../../website/index4-listing-grid.html?raw';

const htmlContent = (() => {
  let content = raw.split('<div id="sns_content"')[1] || '';
  content = '<div id="sns_content"' + content;
  content = content.split('<div id="sns_footer"')[0] || content;
  return content;
})();
</script>

<style lang="less">
@import '@/assets/less/listing.less';
</style>
