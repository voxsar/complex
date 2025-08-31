<template>
  <div id="product_shop" class="product-shop">
    <div class="item-inner product_list_style">
      <div class="item-info">
        <div class="item-title">{{ product.title }}</div>
        <div class="item-price">
          <div class="price-box">
            <span class="price">{{ product.price }}</span>
          </div>
        </div>
        <div class="availability">
          <p class="style1">Availability: {{ product.availability }}</p>
        </div>
        <div class="desc std">
          <h5>QUICK OVERVIEW</h5>
          <p>{{ product.description }}</p>
        </div>
        <div class="actions">
          <button class="btn-cart">Add to Cart</button>
          <ul class="add-to-links">
            <li><a class="link-wishlist" href="#" title="Add to Wishlist">♥</a></li>
            <li><a class="link-compare" href="#" title="Add to Compare">⇄</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    default: () => ({})
  }
});
</script>
