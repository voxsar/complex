<template>
  <div class="products-grid style_grid">
    <div class="item" v-for="product in products" :key="product.id">
      <div class="item-inner">
        <img :src="product.image" :alt="product.name" />
        <div class="info">
          <div class="item-title">{{ product.name }}</div>
          <div class="item-price">{{ product.price }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.products-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
}
.products-grid .item {
  width: calc(25% - 20px);
  padding: 0 10px;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.products-grid .item-inner {
  position: relative;
  overflow: hidden;
  text-align: center;
  border: 1px solid #e5e5e5;
  padding: 10px;
}
.products-grid .item-inner img {
  width: 100%;
  display: block;
  margin-bottom: 10px;
}
.item-title {
  margin-bottom: 5px;
  font-weight: bold;
}
.item-price {
  color: #222;
}
</style>
