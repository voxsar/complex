import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/lara'
import { setupAuthFetch } from './http'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

setupAuthFetch()

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
    // Default theme configuration
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
 })
app.mount('#app')
