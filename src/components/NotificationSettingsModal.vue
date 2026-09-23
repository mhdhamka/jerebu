<template>
  <div class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-orange-50 to-amber-50/40 dark:from-slate-900 dark:to-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-tight">Haze Alerts & PWA App</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">Push & Offline</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Threshold notifications & Home Screen install</p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        <!-- PWA Install Banner -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <div class="text-xs font-black uppercase tracking-wider opacity-90">Progressive Web App (PWA)</div>
            <div class="text-sm font-bold mt-0.5">Install JerebuAQI on Device</div>
            <p class="text-[11px] opacity-90 mt-0.5">Instant launch, offline cache & native notifications.</p>
          </div>
          <button
            type="button"
            @click="installPwa"
            class="px-3.5 py-2 bg-white text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-black shrink-0 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            {{ installStatusText }}
          </button>
        </div>

        <!-- Alert Activation Toggle -->
        <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-black text-slate-800 dark:text-slate-200 block">Push Notifications</span>
              <span class="text-[11px] text-slate-500">Receive alert when air quality degrades</span>
            </div>
            <button
              type="button"
              @click="toggleNotifications"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="config.enabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="config.enabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- Permission Status Badge -->
          <div class="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Browser Status: <strong class="text-slate-700 dark:text-slate-300 font-mono">{{ permissionState }}</strong></span>
            <button
              v-if="permissionState !== 'granted'"
              @click="requestPermission"
              class="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
            >
              Request Permission
            </button>
          </div>
        </div>

        <!-- Threshold Selector -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-300">Alert Trigger Threshold:</span>
            <span class="font-mono font-black text-orange-600 dark:text-orange-400 text-sm">&gt; {{ config.thresholdAqi }} AQI</span>
          </div>
          <input
            type="range"
            min="80"
            max="250"
            step="10"
            v-model.number="config.thresholdAqi"
            @input="saveConfig"
            class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div class="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>80 (Moderate)</span>
            <span>150 (Unhealthy)</span>
            <span>200 (School Closure)</span>
          </div>
        </div>

        <!-- Target Station & School Closure Options -->
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monitored District:</label>
            <select
              v-model="config.targetCity"
              @change="saveConfig"
              class="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="Kuching">Kuching & Samarahan</option>
              <option value="Sri Aman">Sri Aman (Peat Buffer)</option>
              <option value="Miri">Miri & Kuala Baram</option>
              <option value="Sibu">Sibu Central</option>
              <option value="Bintulu">Bintulu Industrial</option>
              <option value="All Sarawak">All Sarawak Stations</option>
            </select>
          </div>

          <label class="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="config.schoolClosureAlert"
              @change="saveConfig"
              class="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
            />
            <span>Priority alert for <strong>MOE School Closure Trigger (&gt;200 AQI)</strong></span>
          </label>
        </div>

        <!-- Test Trigger Button -->
        <div class="pt-2">
          <button
            type="button"
            @click="testAlert"
            class="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <span>Dispatch Test Notification to Device</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { pushService } from '../services/pushNotificationService.js';

const emit = defineEmits(['close', 'toast']);

const config = ref(pushService.getConfig());
const permissionState = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
const installStatusText = ref('Install App');

function saveConfig() {
  pushService.saveConfig(config.value);
}

async function requestPermission() {
  const res = await pushService.requestPermission();
  permissionState.value = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  if (res.status === 'granted') {
    config.value.enabled = true;
    saveConfig();
    emit('toast', '🔔 Notifications enabled!');
  } else {
    emit('toast', `Notification permission: ${res.status}`);
  }
}

async function toggleNotifications() {
  if (!config.value.enabled) {
    await requestPermission();
  } else {
    config.value.enabled = false;
    saveConfig();
    emit('toast', 'Notifications turned off.');
  }
}

function testAlert() {
  const sent = pushService.sendTestNotification('Kuching City', 162);
  if (sent) {
    emit('toast', 'Test notification dispatched to browser!');
  } else {
    emit('toast', 'Please grant notification permission first.');
  }
}

async function installPwa() {
  const accepted = await pushService.promptInstall();
  if (accepted) {
    installStatusText.value = 'Installed!';
    emit('toast', 'JerebuAQI installed successfully!');
  } else {
    emit('toast', 'PWA installation: add to home screen via browser menu.');
  }
}

onMounted(() => {
  if (typeof Notification !== 'undefined') {
    permissionState.value = Notification.permission;
  }
});
</script>
