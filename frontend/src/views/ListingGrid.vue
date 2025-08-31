<template>
  <div class="category-products">
    <ListingGrid :products="products" />
  </div>
</template>

<script setup>
import ListingGrid from '@/components/ListingGrid.vue';

const placeholder = 'https://via.placeholder.com/300';

const products = [
  { id: 1, name: 'Modular Modern', price: '$540.00', image: placeholder },
  { id: 2, name: 'Vintage Chair', price: '$350.00', image: placeholder },
  { id: 3, name: 'Classic Lamp', price: '$120.00', image: placeholder },
  { id: 4, name: 'Wooden Desk', price: '$400.00', image: placeholder },
  { id: 5, name: 'Sofa Set', price: '$800.00', image: placeholder },
  { id: 6, name: 'Office Chair', price: '$220.00', image: placeholder },
  { id: 7, name: 'Dining Table', price: '$650.00', image: placeholder },
  { id: 8, name: 'Cozy Bed', price: '$900.00', image: placeholder },
];
</script>

<style scoped>
.category-products {
  margin-bottom: 15px;
}
</style>
