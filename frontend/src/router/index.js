import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import ListingGrid from '../views/ListingGrid.vue';
import ProductDetail from '../views/ProductDetail.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/listing', name: 'listing', component: ListingGrid },
  { path: '/product', name: 'product', component: ProductDetail },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
