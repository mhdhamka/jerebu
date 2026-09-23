<template>
  <div class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header (Strictly no emojis) -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-850/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold tracking-tight">Geofenced Alerts & Webhooks</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">SYSTEM FEED</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Geofence triggers, Telegram / WhatsApp bot webhooks & CAP 1.2 feeds</p>
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

      <!-- Navigation Tabs (Text-only, no emojis) -->
      <div class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-850 px-5 text-xs font-mono font-semibold">
        <button
          type="button"
          @click="activeTab = 'geofence'"
          :class="[
            'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
            activeTab === 'geofence'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          GEOFENCE & PUSH
        </button>
        <button
          type="button"
          @click="activeTab = 'webhook'"
          :class="[
            'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
            activeTab === 'webhook'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          TELEGRAM / WEBHOOK BOT
        </button>
        <button
          type="button"
          @click="activeTab = 'cap'"
          :class="[
            'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
            activeTab === 'cap'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          CAP 1.2 & GEORSS
        </button>
      </div>

      <!-- Settings Content -->
      <div class="p-5 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto">
        
        <!-- TAB 1: GEOFENCE & PUSH -->
        <div v-if="activeTab === 'geofence'" class="space-y-4">
          <!-- Alert Activation Toggle -->
          <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">Push Notifications</span>
                <span class="text-[11px] text-slate-500">Dispatch browser notification when geofenced air quality degrades</span>
              </div>
              <button
                type="button"
                @click="toggleNotifications"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                :class="geoConfig.enabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="geoConfig.enabled ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Permission Status Badge -->
            <div class="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span>Browser Permission: <strong class="text-slate-700 dark:text-slate-300 font-mono">{{ permissionState }}</strong></span>
              <button
                v-if="permissionState !== 'granted'"
                @click="requestPermission"
                class="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                Request Permission
              </button>
            </div>
          </div>

          <!-- Pinned Geofence Location & Radius -->
          <div class="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40">
            <div class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Geofenced Target Area
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 mb-1">Target District Center:</label>
                <select
                  v-model="selectedDistrictName"
                  @change="handleDistrictChange"
                  class="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="Kuching City Center">Kuching City Center (1.553, 110.359)</option>
                  <option value="Sri Aman Peatland">Sri Aman Peatland (1.237, 111.462)</option>
                  <option value="Miri Urban">Miri Urban (4.399, 113.991)</option>
                  <option value="Sibu Central">Sibu Central (2.287, 111.830)</option>
                  <option value="Bintulu Port">Bintulu Port (3.176, 113.043)</option>
                  <option value="Kuala Baram Peat Buffer">Kuala Baram Peat Buffer (4.582, 114.015)</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 mb-1">Geofence Radius: {{ geoConfig.geofenceRadiusKm }} km</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  v-model.number="geoConfig.geofenceRadiusKm"
                  @input="saveGeoConfig"
                  class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
                />
              </div>
            </div>
          </div>

          <!-- Threshold Selector -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700 dark:text-slate-300">Alert Trigger Threshold:</span>
              <span class="font-mono font-black text-orange-600 dark:text-orange-400 text-sm">&gt; {{ geoConfig.thresholdAqi }} AQI</span>
            </div>
            <input
              type="range"
              min="80"
              max="250"
              step="10"
              v-model.number="geoConfig.thresholdAqi"
              @input="saveGeoConfig"
              class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>80 (Moderate)</span>
              <span>150 (Unhealthy)</span>
              <span>200 (MOE Closure)</span>
            </div>
          </div>

          <!-- Checkbox Options -->
          <div class="space-y-2 pt-1 text-xs">
            <label class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="geoConfig.enableSchoolClosureAlerts"
                @change="saveGeoConfig"
                class="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
              <span>Priority alert for <strong>MOE School Closure Trigger (&gt;200 AQI)</strong></span>
            </label>

            <label class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="geoConfig.enableDivergenceAlerts"
                @change="saveGeoConfig"
                class="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
              <span>Sensor divergence warning when ground reports exceed sensors by &gt;30 AQI</span>
            </label>
          </div>

          <!-- Dispatch Local Test Notification -->
          <div class="pt-2">
            <button
              type="button"
              @click="testLocalAlert"
              class="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 font-mono"
            >
              <span>DISPATCH TEST NOTIFICATION TO BROWSER</span>
            </button>
          </div>
        </div>

        <!-- TAB 2: TELEGRAM / WEBHOOK BOT -->
        <div v-else-if="activeTab === 'webhook'" class="space-y-4">
          <div class="text-xs text-slate-600 dark:text-slate-400">
            Configure automated dispatches to your Telegram channel or custom disaster management webhook endpoint.
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1">Telegram Bot API Webhook URL:</label>
              <input
                type="text"
                v-model="geoConfig.telegramWebhookUrl"
                @input="saveGeoConfig"
                placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage"
                class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1">Telegram Chat ID / Channel (@channel or numeric ID):</label>
              <input
                type="text"
                v-model="geoConfig.telegramChatId"
                @input="saveGeoConfig"
                placeholder="@jerebu_sarawak_alerts or -100123456789"
                class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1">Custom JSON Webhook Endpoint (Civil Defense / WhatsApp Bridge):</label>
              <input
                type="text"
                v-model="geoConfig.customWebhookUrl"
                @input="saveGeoConfig"
                placeholder="https://your-domain.org/api/v1/haze-inbound"
                class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          <!-- Telegram Bot Syntax Reference -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supported Bot Commands</div>
            <div class="font-mono text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
              <div><strong class="text-orange-600">/subscribe &lt;district&gt;</strong> - Register geofence alerts</div>
              <div><strong class="text-orange-600">/status</strong> - Instant regional AQI summary</div>
              <div><strong class="text-orange-600">/divergence</strong> - High-risk micro-climate blindspots</div>
            </div>
          </div>

          <!-- Test Webhook Dispatch Button -->
          <button
            type="button"
            @click="testWebhookDispatch"
            :disabled="isDispatchingWebhook"
            class="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono disabled:opacity-50"
          >
            <span v-if="isDispatchingWebhook" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>TEST DISPATCH WEBHOOK PAYLOAD</span>
          </button>
        </div>

        <!-- TAB 3: CAP 1.2 & GEORSS -->
        <div v-else-if="activeTab === 'cap'" class="space-y-4">
          <div class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Standard OASIS Common Alerting Protocol (CAP v1.2) XML and GeoJSON syndication feeds for emergency broadcast systems and civil protection agencies.
          </div>

          <!-- Feed Endpoints List -->
          <div class="space-y-3">
            <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">OASIS CAP 1.2 XML Feed</span>
                <button
                  type="button"
                  @click="copyUrl('/api/v1/alerts/cap.xml')"
                  class="text-[11px] font-mono font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  COPY URL
                </button>
              </div>
              <code class="block text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 break-all select-all">
                GET /api/v1/alerts/cap.xml
              </code>
            </div>

            <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Emergency Alert GeoJSON Feed</span>
                <button
                  type="button"
                  @click="copyUrl('/api/v1/alerts/feed.json')"
                  class="text-[11px] font-mono font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  COPY URL
                </button>
              </div>
              <code class="block text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 break-all select-all">
                GET /api/v1/alerts/feed.json
              </code>
            </div>
          </div>

          <!-- Preview Payload -->
          <div>
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">CAP 1.2 Schema Snippet</div>
            <pre class="text-[10px] font-mono p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto max-h-36 leading-relaxed select-all">
&lt;alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"&gt;
  &lt;identifier&gt;JEREBU-FEED-2026&lt;/identifier&gt;
  &lt;status&gt;Actual&lt;/status&gt;
  &lt;msgType&gt;Alert&lt;/msgType&gt;
  &lt;scope&gt;Public&lt;/scope&gt;
  &lt;info&gt;
    &lt;category&gt;Env&lt;/category&gt;
    &lt;event&gt;Transboundary Haze Alert&lt;/event&gt;
    &lt;urgency&gt;Immediate&lt;/urgency&gt;
    &lt;severity&gt;Severe&lt;/severity&gt;
    &lt;headline&gt;[HAZE ALERT] Kuching recorded 168 AQI&lt;/headline&gt;
  &lt;/info&gt;
&lt;/alert&gt;</pre>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { geofenceAlertService } from '../services/geofenceAlertService.js';
import { pushService } from '../services/pushNotificationService.js';

const emit = defineEmits(['close', 'toast']);

const activeTab = ref('geofence');
const geoConfig = ref(geofenceAlertService.getConfig());
const permissionState = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
const isDispatchingWebhook = ref(false);

const districtPresets = {
  'Kuching City Center': { lat: 1.5533, lng: 110.3592 },
  'Sri Aman Peatland': { lat: 1.2371, lng: 111.4623 },
  'Miri Urban': { lat: 4.3995, lng: 113.9914 },
  'Sibu Central': { lat: 2.2874, lng: 111.8305 },
  'Bintulu Port': { lat: 3.1762, lng: 113.0435 },
  'Kuala Baram Peat Buffer': { lat: 4.5821, lng: 114.0152 }
};

const selectedDistrictName = ref(geoConfig.value.pinnedLocation?.name || 'Kuching City Center');

function handleDistrictChange() {
  const coords = districtPresets[selectedDistrictName.value];
  if (coords) {
    geoConfig.value.pinnedLocation = {
      name: selectedDistrictName.value,
      lat: coords.lat,
      lng: coords.lng
    };
    saveGeoConfig();
    emit('toast', `Geofence center updated to ${selectedDistrictName.value}`);
  }
}

function saveGeoConfig() {
  geofenceAlertService.saveConfig(geoConfig.value);
}

async function requestPermission() {
  const res = await pushService.requestPermission();
  permissionState.value = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  if (res.status === 'granted') {
    geoConfig.value.enabled = true;
    saveGeoConfig();
    emit('toast', 'Push notifications enabled.');
  } else {
    emit('toast', `Notification permission: ${res.status}`);
  }
}

async function toggleNotifications() {
  if (!geoConfig.value.enabled) {
    await requestPermission();
  } else {
    geoConfig.value.enabled = false;
    saveGeoConfig();
    emit('toast', 'Push notifications disabled.');
  }
}

function testLocalAlert() {
  const sent = pushService.sendTestNotification(
    geoConfig.value.pinnedLocation?.name || 'Kuching City Center',
    168
  );
  if (sent) {
    emit('toast', 'Dispatched test notification to browser.');
  } else {
    emit('toast', 'Please grant browser notification permission first.');
  }
}

async function testWebhookDispatch() {
  isDispatchingWebhook.value = true;
  try {
    const mockAlert = {
      id: `test_${Date.now()}`,
      type: 'HAZE_ALERT',
      severity: 'Severe',
      urgency: 'Immediate',
      stationName: geoConfig.value.pinnedLocation?.name || 'Kuching City Center',
      aqi: 172,
      distanceKm: 8,
      body: 'Air quality index recorded 172 AQI. Ministry of Education SOP: Outdoor sports restricted.',
      timestamp: new Date().toISOString()
    };

    const res = await geofenceAlertService.dispatchWebhook(mockAlert);
    if (res.success) {
      emit('toast', 'Webhook dispatched successfully.');
    } else {
      emit('toast', `Webhook simulation dispatched. (Target: ${geoConfig.value.telegramChatId || 'default'})`);
    }
  } catch (err) {
    emit('toast', `Webhook error: ${err.message}`);
  } finally {
    isDispatchingWebhook.value = false;
  }
}

function copyUrl(path) {
  const full = `${window.location.origin}${path}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(full);
    emit('toast', `Copied endpoint: ${path}`);
  }
}

onMounted(() => {
  if (typeof Notification !== 'undefined') {
    permissionState.value = Notification.permission;
  }
});
</script>
