<template>
  <footer id="sns_footer" class="wrap">
    <div id="sns_footer_top">
      <div class="container">
        <ul class="footer-links">
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/listing">Listing</RouterLink></li>
          <li><RouterLink to="/product">Product</RouterLink></li>
        </ul>
      </div>
    </div>
    <div id="sns_footer_bottom">
      <div class="container">
        <p class="copyright">&copy; 2024 E-Shop. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
#sns_footer {
  margin-top: 2rem;
  color: #fff;
}
#sns_footer_top {
  background: #222;
  padding: 1rem 0;
}
#sns_footer_bottom {
  background: #111;
  padding: 0.5rem 0;
  text-align: center;
}
.footer-links {
  display: flex;
  justify-content: center;
  list-style: none;
  gap: 1rem;
  margin: 0;
  padding: 0;
}
.footer-links a {
  color: #fff;
  text-decoration: none;
}
</style>
