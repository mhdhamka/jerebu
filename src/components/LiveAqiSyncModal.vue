<template>
  <div class="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md select-none overflow-y-auto">
    <div 
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto transition-colors"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-black text-slate-900 dark:text-white tracking-tight">Live Air Quality Sync Hub</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                Kuching & Sarawak
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Integrate live IQAir and Malaysian Department of Environment (DOE) feeds
            </p>
          </div>
        </div>

        <button 
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mode Selector Tabs (Options 1, 2, 3) -->
      <div class="px-5 pt-4">
        <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
          <button 
            type="button"
            @click="activeOption = 2"
            :class="[
              'py-2 px-2.5 rounded-xl transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center',
              activeOption === 2 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-extrabold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Option 2: Open Feed</span>
            </span>
            <span class="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 font-semibold">Zero-Config (Instant)</span>
          </button>

          <button 
            type="button"
            @click="activeOption = 3"
            :class="[
              'py-2 px-2.5 rounded-xl transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center',
              activeOption === 3 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-extrabold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span>Option 3: IQAir Scraper</span>
            </span>
            <span class="text-[10px] font-normal text-orange-600 dark:text-orange-400 font-semibold">URL Snapshot Parser</span>
          </button>

          <button 
            type="button"
            @click="activeOption = 1"
            :class="[
              'py-2 px-2.5 rounded-xl transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center',
              activeOption === 1 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-extrabold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Option 1: IQAir API</span>
            </span>
            <span class="text-[10px] font-normal text-blue-600 dark:text-blue-400 font-semibold">Official API Key</span>
          </button>
        </div>
      </div>

      <!-- Main Body per Option -->
      <div class="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        
        <!-- OPTION 2: Open Station Feed (DOE Malaysia / Open Meteo) -->
        <div v-if="activeOption === 2" class="space-y-3">
          <div class="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div class="font-bold flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant Real-Time Feed (No API Key Required)</span>
            </div>
            <p class="leading-relaxed text-[11px] text-emerald-800 dark:text-emerald-300/90">
              Directly synchronizes with continuous monitoring sensors situated across Sarawak's DOE stations. Provides real-time US AQI, PM2.5, PM10, temperature, humidity, and wind.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Station</label>
              <select 
                v-model="selectedStationId"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value="MY_SWK_02">Kuching City (APIMS) - 1.5533° N, 110.3592° E</option>
                <option value="MY_SWK_05">Samarahan (APIMS) - 1.4500° N, 110.4833° E</option>
                <option value="MY_SWK_06">Sri Aman (APIMS) - 1.2333° N, 111.4667° E</option>
                <option value="MY_SWK_01">Miri ILP (APIMS) - 4.4124° N, 114.0041° E</option>
                <option value="MY_SWK_03">Bintulu Port (APIMS) - 3.2385° N, 113.0711° E</option>
                <option value="MY_SWK_04">Sibu Town Center (APIMS) - 2.2875° N, 111.8305° E</option>
              </select>
            </div>

            <div class="pt-5">
              <button
                type="button"
                @click="fetchOption2"
                :disabled="isLoading"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Fetch Live Reading</span>
              </button>
            </div>
          </div>
        </div>

        <!-- OPTION 3: IQAir URL Web Scraper & Snapshot Parser -->
        <div v-if="activeOption === 3" class="space-y-3">
          <div class="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-2xl p-3.5 text-xs text-orange-900 dark:text-orange-200">
            <div class="font-bold flex items-center gap-1.5 mb-1 text-orange-700 dark:text-orange-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>IQAir Page Scraper & Snapshot Parser</span>
            </div>
            <p class="leading-relaxed text-[11px] text-orange-800 dark:text-orange-300/90">
              Extracts the current live widget numbers directly from <code class="bg-orange-200/60 dark:bg-orange-900/60 px-1 py-0.5 rounded font-mono">iqair.com/.../kuching</code> (US AQI, PM2.5: 68.3 µg/m³, weather, 1 station attribution).
            </p>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">IQAir Target Page URL</label>
            <div class="flex items-center gap-2">
              <input 
                v-model="iqairUrl"
                type="url"
                class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                placeholder="https://www.iqair.com/air-quality/malaysia/sarawak/kuching"
              />
              <button
                type="button"
                @click="fetchOption3"
                :disabled="isLoading"
                class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
              >
                <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Scrape / Extract</span>
              </button>
            </div>
          </div>

          <!-- Direct Snapshot Paste Accordion -->
          <div class="border-t border-slate-100 dark:border-slate-800 pt-2">
            <button 
              type="button"
              @click="showRawHtmlPaste = !showRawHtmlPaste"
              class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 flex items-center gap-1 cursor-pointer"
            >
              <span>{{ showRawHtmlPaste ? 'Hide' : 'Or paste HTML / DevTools snippet manually' }}</span>
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showRawHtmlPaste }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="showRawHtmlPaste" class="mt-2 space-y-2">
              <textarea 
                v-model="rawHtmlSnippet"
                rows="3"
                placeholder="Paste page HTML or <script id='__NEXT_DATA__'> payload here if Cloudflare challenge is triggered..."
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              ></textarea>
              <button 
                type="button"
                @click="parseRawHtmlSnippet"
                class="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Parse Snippet
              </button>
            </div>
          </div>
        </div>

        <!-- OPTION 1: Official IQAir (AirVisual) REST API -->
        <div v-if="activeOption === 1" class="space-y-3">
          <div class="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3.5 text-xs text-blue-900 dark:text-blue-200">
            <div class="font-bold flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Official IQAir AirVisual REST API</span>
            </div>
            <p class="leading-relaxed text-[11px] text-blue-800 dark:text-blue-300/90">
              Use your registered IQAir Community API key. Free tiers include 10,000 monthly calls.
              <a href="https://www.iqair.com/air-pollution-data-api" target="_blank" class="underline font-bold text-blue-600 dark:text-blue-400 ml-1">Get free key &rarr;</a>
            </p>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">IQAir API Key</label>
            <input 
              v-model="apiKeyInput"
              type="password"
              placeholder="Paste your AirVisual Community API Key..."
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">City</label>
              <input v-model="apiParams.city" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">State</label>
              <input v-model="apiParams.state" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country</label>
              <input v-model="apiParams.country" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white" />
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <button
              type="button"
              @click="fetchOption1"
              :disabled="isLoading || !apiKeyInput"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Fetch from IQAir API</span>
            </button>
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">{{ errorMessage }}</div>
        </div>

        <!-- LIVE RESULT PREVIEW CARD -->
        <div v-if="latestResult" class="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-[11px] uppercase tracking-wider text-slate-400">Live Synchronized Payload</span>
            <span class="text-[10px] font-mono text-slate-500">{{ latestResult.source }}</span>
          </div>

          <!-- Hero Metric block styled like user's IQAir screenshot card -->
          <div 
            class="rounded-2xl p-4 text-white shadow-lg relative overflow-hidden flex items-center justify-between"
            :style="{ background: aqiCardGradient }"
          >
            <div>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-mono font-black tracking-tight">{{ latestResult.aqi }}</span>
                <span class="text-xs font-bold uppercase tracking-wider opacity-90">US AQI</span>
              </div>
              <div class="text-base font-extrabold tracking-tight mt-0.5">{{ latestResult.status }}</div>
              <div class="text-xs opacity-90 mt-1 flex items-center gap-3">
                <span>Main pollutant: <strong class="font-bold">{{ latestResult.mainPollutant }}</strong></span>
                <span v-if="latestResult.pm25"><strong>{{ latestResult.pm25 }}</strong> µg/m³</span>
              </div>
            </div>

            <div class="text-right flex flex-col items-end gap-1">
              <div class="text-xs font-semibold flex items-center gap-2 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-xl">
                <span>🌧️ {{ latestResult.weather?.tempC ?? 25 }}°C</span>
                <span>💨 {{ latestResult.weather?.windKmh ?? 4 }} km/h</span>
                <span>💧 {{ latestResult.weather?.humidity ?? 96 }}%</span>
              </div>
              <div class="text-[10px] opacity-80 mt-1">
                {{ latestResult.city }} Station
              </div>
            </div>
          </div>

          <!-- Comparison against map station -->
          <div class="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-300">
            <span class="text-[11px]">Attribution: <strong>{{ latestResult.attribution }}</strong></span>
            <span class="text-[10px] font-mono text-slate-400">{{ latestResult.timestamp }}</span>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <button
          type="button"
          @click="syncAllSarawakStations"
          :disabled="isLoading"
          class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Sync All 10 Sarawak Stations
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            @click="applySyncToMap"
            :disabled="!latestResult"
            class="px-5 py-2 rounded-xl text-xs font-black text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Apply to Map Station</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { liveAqiSync } from '../services/liveAqiSyncService.js';
import { getAQIColor } from '../data/officialStations.js';

const props = defineProps({
  stations: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'station-updated', 'sync-all', 'toast']);

const activeOption = ref(2); // Default to Option 2 (zero config)
const isLoading = ref(false);
const errorMessage = ref('');
const latestResult = ref(null);

const selectedStationId = ref('MY_SWK_02'); // Kuching City (APIMS)
const iqairUrl = ref('https://www.iqair.com/air-quality/malaysia/sarawak/kuching');
const showRawHtmlPaste = ref(false);
const rawHtmlSnippet = ref('');

const apiKeyInput = ref(liveAqiSync.getApiKey());
const apiParams = ref({
  city: 'Kuching',
  state: 'Sarawak',
  country: 'Malaysia'
});

const aqiCardGradient = computed(() => {
  if (!latestResult.value) return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
  const aqi = latestResult.value.aqi;
  if (aqi <= 50) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  if (aqi <= 100) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  if (aqi <= 150) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
  if (aqi <= 200) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
});

// Auto-run Option 2 on mount so the user immediately sees live data
onMounted(async () => {
  await fetchOption2();
});

// OPTION 2
async function fetchOption2() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const station = (props.stations || []).find(s => s.id === selectedStationId.value) || {
      lat: 1.5533,
      lng: 110.3592,
      city: 'Kuching',
      name: 'Kuching City (APIMS)'
    };

    const res = await liveAqiSync.fetchOpenStationFeed({
      lat: station.lat,
      lng: station.lng,
      city: station.city,
      stationName: station.name
    });

    latestResult.value = res;
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch Open Station Feed';
  } finally {
    isLoading.value = false;
  }
}

// OPTION 3
async function fetchOption3() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await liveAqiSync.scrapeIQAir({
      url: iqairUrl.value
    });
    latestResult.value = res;
  } catch (err) {
    errorMessage.value = err.message || 'Failed to scrape IQAir page';
  } finally {
    isLoading.value = false;
  }
}

function parseRawHtmlSnippet() {
  if (!rawHtmlSnippet.value.trim()) {
    errorMessage.value = 'Please paste HTML or JSON snippet first.';
    return;
  }
  errorMessage.value = '';
  try {
    const res = liveAqiSync.parseIQAirHtml(rawHtmlSnippet.value, iqairUrl.value);
    latestResult.value = res;
  } catch (err) {
    errorMessage.value = err.message;
  }
}

// OPTION 1
async function fetchOption1() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    liveAqiSync.setApiKey(apiKeyInput.value);
    const res = await liveAqiSync.fetchIQAirApi({
      apiKey: apiKeyInput.value,
      city: apiParams.value.city,
      state: apiParams.value.state,
      country: apiParams.value.country
    });
    latestResult.value = res;
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch from IQAir API';
  } finally {
    isLoading.value = false;
  }
}

function applySyncToMap() {
  if (!latestResult.value) return;

  const targetStationId = selectedStationId.value || 'MY_SWK_02';
  emit('station-updated', {
    stationId: targetStationId,
    updatedData: {
      aqi: latestResult.value.aqi,
      status: latestResult.value.status,
      pm25: latestResult.value.pm25,
      updatedAt: 'Just now (Live Sync)',
      source: latestResult.value.attribution || 'DOE Malaysia (APIMS) / IQAir Feed',
      description: `Live synchronized: ${latestResult.value.source}. Weather: ${latestResult.value.weather?.tempC || 25}°C, ${latestResult.value.weather?.humidity || 96}% humidity.`
    }
  });

  emit('toast', `Live synchronized ${latestResult.value.city}: AQI ${latestResult.value.aqi} (${latestResult.value.status})`);
  emit('close');
}

async function syncAllSarawakStations() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    emit('sync-all');
    emit('close');
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}
</script>
