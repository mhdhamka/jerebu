/**
 * Push Notification & Haze Alert Threshold Service
 * Manages user alert thresholds, browser Notification permissions, and simulated push dispatches.
 */

const STORAGE_KEY = 'jerebu_alert_config';

export class PushNotificationService {
  constructor() {
    this.config = this.loadConfig();
    this.deferredInstallPrompt = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
      });
    }
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse alert config:', e);
    }
    return {
      enabled: false,
      thresholdAqi: 150,
      targetCity: 'Kuching',
      schoolClosureAlert: true,
      soundEnabled: true,
      lastNotifiedAt: null
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save alert config:', e);
    }
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { supported: false, status: 'unsupported' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.saveConfig({ enabled: true });
        return { supported: true, status: 'granted' };
      }
      return { supported: true, status: permission };
    } catch (err) {
      return { supported: true, status: 'error', error: err.message };
    }
  }

  sendTestNotification(stationName = 'Kuching City', aqi = 162) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    const title = `⚠️ Haze Alert: ${stationName} crossed ${this.config.thresholdAqi} AQI`;
    const options = {
      body: `Current reading: ${aqi} AQI (Unhealthy). MOE Advisory: School outdoor sports suspended. N95 advised.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'jerebu-test-alert'
    };

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, options);
        return true;
      } catch (e) {
        console.warn('Direct notification error, trying SW:', e);
      }
    }

    // Try service worker registration showNotification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      });
      return true;
    }

    return false;
  }

  getInstallPrompt() {
    return this.deferredInstallPrompt;
  }

  async promptInstall() {
    if (!this.deferredInstallPrompt) return false;
    this.deferredInstallPrompt.prompt();
    const { outcome } = await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    return outcome === 'accepted';
  }
}

export const pushService = new PushNotificationService();
