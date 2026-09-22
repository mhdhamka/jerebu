import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

createApp(App).mount('#app');

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
