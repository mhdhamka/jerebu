import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

// Register PWA Service Worker
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('JerebuAQI SW registered:', registration.scope);
    }).catch((error) => {
      console.warn('JerebuAQI SW registration failed:', error);
    });
  });
}
