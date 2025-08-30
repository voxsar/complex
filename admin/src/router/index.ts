import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/products'
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../views/AnalyticsDashboard.vue'),
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/products/ProductsList.vue'),
  },
  {
    path: '/products/collections',
    name: 'Collections',
    component: () => import('../views/products/CollectionsList.vue')
  },
  {
    path: '/products/collections/create',
    name: 'CreateCollection',
    component: () => import('../views/products/CollectionCreate.vue')
  },
  {
    path: '/products/categories',
    name: 'Categories',
    component: () => import('../views/products/CategoriesList.vue')
  },
  {
    path: '/products/categories/create',
    name: 'CreateCategory',
    component: () => import('../views/products/CategoryCreate.vue')
  },
  {
    path: '/products/:id',
    name: 'ProductView',
    component: () => import('../views/products/ProductView.vue')
  },
  {
    path: '/product-options',
    name: 'ProductOptions',
    component: () => import('../views/products/ProductOptionsList.vue')
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('../views/InventoryList.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/OrdersList.vue')
  },
  {
    path: '/orders/claims',
    name: 'OrderClaims',
    component: () => import('../views/orders/ClaimsList.vue')
  },
  {
    path: '/orders/exchanges',
    name: 'OrderExchanges',
    component: () => import('../views/orders/ExchangesList.vue')
  },
  {
    path: '/orders/returns',
    name: 'OrderReturns',
    component: () => import('../views/orders/ReturnsList.vue')
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('../views/CustomersList.vue'),
    children: [
      {
        path: 'groups',
        name: 'CustomerGroups',
        component: () => import('../views/CustomerGroupsList.vue')
      }
    ]
  },
  {
    path: '/customers/:id',
    name: 'CustomerDetail',
    component: () => import('../views/customers/CustomerDetail.vue')
  },
  {
    path: '/customers/:id/wishlist',
    name: 'CustomerWishlist',
    component: () => import('../views/customers/CustomerWishlist.vue')
  },
  {
    path: '/promotions',
    name: 'Promotions',
    component: () => import('../views/PromotionsList.vue'),
    children: [
      {
        path: 'campaigns',
        name: 'Campaigns',
        component: () => import('../views/CampaignsList.vue')
      }
    ]
  },
  {
    path: '/price-lists',
    name: 'PriceLists',
    component: () => import('../views/PriceListsList.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    children: [
      { path: 'payments', name: 'Payments', component: () => import('../views/settings/PaymentsList.vue') },
      { path: 'payment-intents', name: 'PaymentIntents', component: () => import('../views/settings/PaymentIntentsList.vue') },
      { path: 'refunds', name: 'Refunds', component: () => import('../views/settings/RefundsList.vue') },
      { path: 'roles', name: 'Roles', component: () => import('../views/settings/RolesList.vue') },
      { path: 'sales-channels', name: 'SalesChannels', component: () => import('../views/settings/SalesChannelsList.vue') },
      { path: 'saved-payment-methods', name: 'SavedPaymentMethods', component: () => import('../views/settings/SavedPaymentMethodsList.vue') },
      { path: 'shipments', name: 'Shipments', component: () => import('../views/settings/ShipmentsList.vue') },
      { path: 'shipping-providers', name: 'ShippingProviders', component: () => import('../views/settings/ShippingProvidersList.vue') },
      { path: 'shipping-rates', name: 'ShippingRates', component: () => import('../views/settings/ShippingRatesList.vue') },
      { path: 'shipping-zones', name: 'ShippingZones', component: () => import('../views/settings/ShippingZonesList.vue') },
      { path: 'tax-regions', name: 'TaxRegions', component: () => import('../views/settings/TaxRegionsList.vue') },
      { path: 'users', name: 'Users', component: () => import('../views/settings/UsersList.vue') },
      { path: 'webhooks', name: 'Webhooks', component: () => import('../views/settings/WebhooksList.vue') }
      { path: 'api-keys', name: 'ApiKeys', component: () => import('../views/ApiKeysList.vue') },
      { path: 'api-keys/:id', name: 'ApiKeyDetail', component: () => import('../views/ApiKeyDetail.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken')
  if (to.meta.requiresAuth === false) {
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
