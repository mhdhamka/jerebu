<template>
  <div class="relative w-full h-full min-w-0 min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
    <!-- Map Canvas Container (Strictly bounded to viewport) -->
    <div id="jerebu-map" class="absolute inset-0 w-full h-full z-0 outline-none overflow-hidden"></div>

    <!-- Unified Left Map & Data Hub (Combines Community Feed, Hotspots, Map Layers, NASA FIRMS Engine) -->
    <div class="absolute top-4 left-4 z-[420]">
      <LeftMapHub
        v-model="filters"
        :official-count="officialStations.length"
        :report-count="reports.length"
        :anomaly-count="anomalyClusters.filter(a => a.isAnomaly || a.is_anomaly).length"
        :hotspot-count="hotspots.length"
        :divergence-count="divergences.length"
        :wind-speed="windData?.speedKmh || 14.5"
        :wind-direction="windData?.directionLabel || 'SW'"
        :visible-hotspots-count="visibleHotspotsCount"
        :total-visible-frp="totalVisibleFrp"
        :is-firms-syncing="isFirmsSyncing"
        :regions="regions"
        :active-region="activeRegion"
        :is-left-feed-visible="isLeftFeedVisible"
        @toggle-feed="$emit('toggle-feed')"
        @select-region="selectRegion"
        @sync-firms="triggerFirmsSync"
        @toast="$emit('toast', $event)"
      />
    </div>

    <!-- Map Click Picker Notification Banner -->
    <div
      v-if="isPickingLocation"
      class="absolute top-4 right-4 z-[400] bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white font-medium text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80"
    >
      <span class="relative flex h-2.5 w-2.5">
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
      </span>
      <span>Click anywhere on map to pin report</span>
      <button 
        @click="$emit('cancel-pick')" 
        class="ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-semibold"
      >
        Cancel
      </button>
    </div>

    <!-- Compact Symbol Air Quality Scale Legend Button -->
    <div class="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-[400]" ref="legendContainer">
      <div class="relative">
        <button
          type="button"
          @click="isLegendOpen = !isLegendOpen"
          class="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl text-slate-700 dark:text-slate-200 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
          title="Air Quality Scale Legend"
        >
          <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </button>

        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0 translate-y-2"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 translate-y-2"
        >
          <div 
            v-if="isLegendOpen"
            class="absolute bottom-full mb-2 right-0 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-4 z-50 text-xs"
          >
            <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span>Air Quality Scale</span>
            </div>
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-sm ring-2 ring-emerald-500/20"></div>
                  <span>Good</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">0–50</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-amber-400 rounded-full shadow-sm ring-2 ring-amber-400/20"></div>
                  <span>Moderate</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">51–100</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-orange-500 rounded-full shadow-sm ring-2 ring-orange-500/20"></div>
                  <span>Unhealthy</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">101–200</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-red-600 rounded-full shadow-sm ring-2 ring-red-600/20"></div>
                  <span>Hazardous</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">201+</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- NASA FIRMS Map Key Modal -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isMapKeyModalOpen"
        class="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
        @click.self="isMapKeyModalOpen = false"
      >
        <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900 dark:text-white">NASA FIRMS API Key</h3>
                <p class="text-xs text-slate-500">Configure Earthdata credentials</p>
              </div>
            </div>
            <button
              type="button"
              @click="isMapKeyModalOpen = false"
              class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              By default, JerebuAQI automatically fetches the latest active fire detections from NASA's Near Real-Time feeds for Southeast Asia without requiring any key.
            </p>
            <p>
              If you have a dedicated <strong>NASA FIRMS MAP Key</strong>, paste it below. Keys are securely sanitized and never broadcast in plain client URLs.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">FIRMS Map Key</label>
            <input
              type="text"
              v-model="userMapKeyInput"
              placeholder="e.g. 9a7b8c... (leave empty for free NRT feed)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div class="flex items-center justify-between pt-2">
            <a
              href="https://firms.modaps.eosdis.nasa.gov/api/map_key"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Get Free Key</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div class="flex items-center gap-2">
              <button
                type="button"
                v-if="userMapKeyInput"
                @click="clearMapKey"
                class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                @click="saveMapKey"
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer transition-all"
              >
                Save & Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed, onUnmounted } from 'vue';
import L from 'leaflet';
import { getAQIColor } from '../data/officialStations.js';
import LeftMapHub from './LeftMapHub.vue';
import { calculateDistanceKm } from '../data/sarawakLocations.js';
import { firmsService } from '../services/nasaFirmsService.js';
import { useLeafletMap } from '@/src/composables/useLeafletMap.js';
import { useFirmsCanvasLayer } from '@/src/composables/useFirmsCanvasLayer.js';
import { useWindParticles } from '@/src/composables/useWindParticles.js';
import { useAnomalyLayers } from '@/src/composables/useAnomalyLayers.js';
import { escapeText, sanitizeHtml } from '@/src/utils/security.js';

const props = defineProps({
  officialStations: { type: Array, default: () => [] },
  reports: { type: Array, default: () => [] },
  anomalyClusters: { type: Array, default: () => [] },
  hotspots: { type: Array, default: () => [] },
  windData: { type: Object, default: () => ({ speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' }) },
  divergences: { type: Array, default: () => [] },
  isPickingLocation: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
  isLeftFeedVisible: { type: Boolean, default: false }
});

const emit = defineEmits([
  'location-selected',
  'cancel-pick',
  'select-report',
  'upvote-report',
  'share-report',
  'report-at-location',
  'open-sync-modal',
  'open-forecast-modal',
  'open-moe-modal',
  'toast',
  'refresh-firms',
  'toggle-feed'
]);

// Composables
const { map, layers, initMap, setTileLayer, syncLayerVisibility, invalidateSize, destroyMap } = useLeafletMap();
const { renderFirmsHotspots } = useFirmsCanvasLayer();
const { renderWindGrid } = useWindParticles();
const { renderAnomalies } = useAnomalyLayers();

let tempPickMarker = null;
let searchLocationMarker = null;
let currentSearchedLoc = null;

const isFirmsHudExpanded = ref(false);
const isFirmsSyncing = ref(false);
const isMapKeyModalOpen = ref(false);
const userMapKeyInput = ref(firmsService.getMapKey());

const hotspotFilters = ref({
  sensor: 'all',
  confidence: 'all',
  onlyTransboundary: false
});

const filteredHotspots = computed(() => {
  let list = props.hotspots || [];
  if (hotspotFilters.value.sensor !== 'all') {
    const s = hotspotFilters.value.sensor.toLowerCase();
    list = list.filter(h =>
      (h.sensorType || '').toLowerCase() === s ||
      (s === 'viirs' && (h.satellite || '').includes('VIIRS')) ||
      (s === 'modis' && (h.satellite || '').includes('MODIS'))
    );
  }
  if (hotspotFilters.value.confidence === 'high') {
    list = list.filter(h => h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80));
  }
  if (hotspotFilters.value.onlyTransboundary) {
    list = list.filter(h => h.isTransboundary);
  }
  return list;
});

const visibleHotspotsCount = computed(() => filteredHotspots.value.length);
const totalVisibleFrp = computed(() => Math.round(filteredHotspots.value.reduce((sum, h) => sum + (h.frp || 0), 0)));
const transboundaryCount = computed(() => filteredHotspots.value.filter(h => h.isTransboundary).length);
const apiKeyMasked = computed(() => {
  const k = firmsService.getMapKey();
  if (!k) return 'Free NRT Feed';
  return k.slice(0, 4) + '••••' + k.slice(-3);
});

async function triggerFirmsSync() {
  if (isFirmsSyncing.value) return;
  isFirmsSyncing.value = true;
  emit('toast', 'Fetching live NASA FIRMS active fire satellite data...');
  try {
    const res = await firmsService.fetchLiveHotspots({
      sensor: hotspotFilters.value.sensor,
      confidence: hotspotFilters.value.confidence,
      refresh: true
    });
    emit('refresh-firms', res);
    emit('toast', `Synced: ${res.hotspots?.length || 0} active hotspots from NASA FIRMS`);
  } catch (err) {
    emit('toast', `NASA FIRMS notice: ${err.message}`);
  } finally {
    isFirmsSyncing.value = false;
  }
}

function openMapKeyDialog() {
  userMapKeyInput.value = firmsService.getMapKey();
  isMapKeyModalOpen.value = true;
}

function saveMapKey() {
  firmsService.setMapKey(userMapKeyInput.value);
  isMapKeyModalOpen.value = false;
  emit('toast', userMapKeyInput.value ? 'NASA FIRMS Map Key saved!' : 'Switched to free Near-Real-Time NASA feed.');
  triggerFirmsSync();
}

function clearMapKey() {
  userMapKeyInput.value = '';
  firmsService.setMapKey('');
  isMapKeyModalOpen.value = false;
  emit('toast', 'Reset to free NASA Near-Real-Time feeds.');
  triggerFirmsSync();
}

const activeRegion = ref('Miri (Hotspot)');
const isRegionDropdownOpen = ref(false);
const isLegendOpen = ref(false);
const dropdownContainer = ref(null);
const legendContainer = ref(null);

const filters = ref({
  official: true,
  community: true,
  anomalies: true,
  hotspots: true,
  wind: true,
  divergence: true
});

const regions = [
  { name: 'Miri (Hotspot)', flag: '🇲🇾', lat: 4.450, lng: 114.020, zoom: 12 },
  { name: 'Kuching', flag: '🇲🇾', lat: 1.5533, lng: 110.3592, zoom: 12 },
  { name: 'Sri Aman', flag: '🇲🇾', lat: 1.2333, lng: 111.4667, zoom: 12 },
  { name: 'Ketapang (Palung)', flag: '🇮🇩', lat: -1.350, lng: 110.150, zoom: 11 },
  { name: 'Sambas Border', flag: '🇮🇩', lat: 0.884, lng: 109.825, zoom: 11 },
  { name: 'Pontianak', flag: '🇮🇩', lat: -0.026, lng: 109.342, zoom: 11 },
  { name: 'Sibu', flag: '🇲🇾', lat: 2.2875, lng: 111.8305, zoom: 12 },
  { name: 'Bintulu', flag: '🇲🇾', lat: 3.1725, lng: 113.0433, zoom: 12 },
  { name: 'Klang Valley', flag: '🇲🇾', lat: 3.100, lng: 101.620, zoom: 11 },
  { name: 'Riau Sumatra', flag: '🇮🇩', lat: 0.507, lng: 101.447, zoom: 9 }
];

const layerKeyMap = {
  '1': { key: 'official', name: 'Official AQI Stations' },
  '2': { key: 'community', name: 'Community Ground Reports' },
  '3': { key: 'anomalies', name: 'DBSCAN Anomaly Clusters' },
  '4': { key: 'hotspots', name: 'NASA FIRMS Satellite Hotspots' },
  '5': { key: 'wind', name: 'Wind & Plume Vectors' },
  '6': { key: 'divergence', name: 'Sensor Reality Divergence' }
};

function handleKeyDown(e) {
  const target = e.target;
  const tagName = (target?.tagName || '').toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  const match = layerKeyMap[e.key];
  if (match) {
    e.preventDefault();
    filters.value[match.key] = !filters.value[match.key];
    const isNowActive = filters.value[match.key];
    emit('toast', {
      type: isNowActive ? 'success' : 'info',
      message: `[Key ${e.key}] ${match.name}: ${isNowActive ? 'VISIBLE' : 'HIDDEN'}`
    });
  }
}

const currentRegionObject = computed(() => {
  return regions.find(r => r.name === activeRegion.value) || regions[0];
});

function selectRegion(region) {
  activeRegion.value = region.name;
  isRegionDropdownOpen.value = false;
  if (map.value) {
    map.value.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.25 });
  }
}

function handleClickOutside(e) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(e.target)) {
    isRegionDropdownOpen.value = false;
  }
  if (legendContainer.value && !legendContainer.value.contains(e.target)) {
    isLegendOpen.value = false;
  }
}

function handleLocationSelected(loc) {
  if (!map.value) return;
  currentSearchedLoc = loc;
  map.value.flyTo([loc.lat, loc.lng], loc.zoom || 14, { duration: 1.4 });

  if (searchLocationMarker) {
    map.value.removeLayer(searchLocationMarker);
    searchLocationMarker = null;
  }

  let nearestStation = null;
  let minDistance = Infinity;
  for (const st of props.officialStations) {
    const d = calculateDistanceKm(loc.lat, loc.lng, st.lat, st.lng);
    if (d < minDistance) {
      minDistance = d;
      nearestStation = st;
    }
  }

  const isDark = props.isDark;
  const pinBorder = isDark ? '#0f172a' : '#ffffff';

  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); border: 3px solid ${pinBorder}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -4px rgba(234, 88, 12, 0.6); color: white;">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
    </div>
  `;

  searchLocationMarker = L.marker([loc.lat, loc.lng], {
    icon: L.divIcon({ html: iconHtml, className: 'custom-search-highlight-pin', iconSize: [40, 40], iconAnchor: [20, 20] })
  }).addTo(map.value);

  const safeName = escapeText(loc.name);
  const safeDivision = escapeText(loc.division || 'Sarawak');

  const popupHtml = `
    <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-orange-200/80 dark:border-orange-800/80 shadow-2xl min-w-[280px]">
      <div class="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 mb-1">Selected Location</div>
      <div class="text-base font-bold text-slate-900 dark:text-white mb-0.5">${safeName}</div>
      <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">${safeDivision}</div>

      <div class="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mb-3 space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Nearest Station:</span>
          <span class="font-bold text-slate-800 dark:text-slate-200">${escapeText(nearestStation?.name || 'N/A')}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Distance:</span>
          <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">${minDistance === Infinity ? 'N/A' : `${minDistance} km`}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn-report-here-action flex-1 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl text-xs font-bold text-center cursor-pointer shadow-md shadow-orange-500/20"
          data-loc-name="${safeName}"
          data-loc-lat="${loc.lat}"
          data-loc-lng="${loc.lng}"
        >
          Submit Report Here
        </button>
        <button
          type="button"
          class="btn-dismiss-search-pin p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-semibold cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  `;

  searchLocationMarker.bindPopup(popupHtml, { maxWidth: 320 }).openPopup();
  emit('toast', `Centered map on ${safeName} (${safeDivision})`);
}

function renderOfficialMarkers() {
  if (!layers.value?.official) return;
  layers.value.official.clearLayers();

  const isDark = props.isDark;
  const badgeBorder = isDark ? '#0f172a' : '#ffffff';
  const labelBg = isDark ? '#0f172a' : '#ffffff';
  const labelText = isDark ? '#f8fafc' : '#1e293b';
  const labelBorder = isDark ? '#334155' : '#e2e8f0';

  for (const st of props.officialStations) {
    const colorInfo = getAQIColor(st.aqi);
    const safeName = escapeText(st.name);
    const safeSource = escapeText(st.source || 'APIMS / DOE');
    const safeDesc = escapeText(st.description || '');

    const iconHtml = `
      <div class="flex flex-col items-center group cursor-pointer">
        <div style="background-color: ${colorInfo.bg}; color: #ffffff; width: 44px; height: 44px; border-radius: 50%; border: 3.5px solid ${badgeBorder}; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -4px rgba(0, 0, 0, 0.3); font-family: 'Space Mono', monospace; font-weight: 800; font-size: 13px;">
          ${st.aqi}
        </div>
        <div style="background-color: ${labelBg}; color: ${labelText}; border: 1px solid ${labelBorder};" class="px-2.5 py-0.5 rounded-lg shadow-sm text-[10px] font-bold mt-1 whitespace-nowrap">
          ${escapeText(st.city || st.name.split(' ')[0])}
        </div>
      </div>
    `;

    const marker = L.marker([st.lat, st.lng], {
      icon: L.divIcon({ html: iconHtml, className: 'custom-official-pin', iconSize: [60, 60], iconAnchor: [30, 22] })
    });

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[260px] text-xs">
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span class="text-[10px] uppercase font-black tracking-widest text-slate-400">Official Station</span>
          <span class="text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase" style="background:${colorInfo.bg}20; color:${colorInfo.bg}; border: 1px solid ${colorInfo.bg}40;">${colorInfo.label}</span>
        </div>
        <div class="text-sm font-bold text-slate-900 dark:text-white mb-0.5">${safeName}</div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">${safeSource}</div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-3">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">AQI</div>
            <div class="text-2xl font-mono font-extrabold" style="color: ${colorInfo.bg}">${st.aqi}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">PM2.5</div>
            <div class="text-base font-mono font-extrabold text-slate-700 dark:text-slate-200">${st.pm25 || 25} <span class="text-[9px] font-normal text-slate-400">µg/m³</span></div>
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">${safeDesc}</div>

        <button
          type="button"
          class="btn-sync-station-action w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
          data-station-id="${st.id}"
        >
          <span>Live Sync IQAir / DOE Feed</span>
        </button>

        <div class="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn-forecast-station-action py-1.5 px-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 border border-orange-200 text-orange-800 dark:text-orange-200 rounded-xl text-[11px] font-bold text-center cursor-pointer"
            data-station-id="${st.id}"
          >
            Forecast
          </button>
          <button
            type="button"
            class="btn-moe-station-action py-1.5 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 border border-red-200 text-red-800 dark:text-red-200 rounded-xl text-[11px] font-bold text-center cursor-pointer"
            data-station-id="${st.id}"
          >
            MOE SOP
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    layers.value.official.addLayer(marker);
  }
}

function renderReportMarkers() {
  if (!layers.value?.reports) return;
  layers.value.reports.clearLayers();

  const isDark = props.isDark;
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardText = isDark ? '#f8fafc' : '#0f172a';
  const cardBorder = isDark ? '#334155' : '#cbd5e1';

  for (const rep of props.reports) {
    const safeArea = escapeText(rep.areaName || rep.area_name);
    const safeReporter = escapeText(rep.reporterName || 'Citizen');
    const safeRole = escapeText(rep.reporterRole || 'Resident');
    const safeDesc = sanitizeHtml(rep.description);
    const safeSmell = escapeText(rep.smellLevel || rep.smell_level || 'Moderate');
    const aqiVal = rep.estimatedAqi || rep.estimated_aqi || 120;
    const trustVal = rep.trustScore || rep.trust_weight || 1.0;
    const visVal = rep.visibilityMeters || rep.visibility_meters || 1000;

    const iconHtml = `
      <div class="flex flex-col items-center cursor-pointer group">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; border: 3.5px solid ${isDark ? '#0f172a' : '#ffffff'}; box-shadow: 0 8px 20px -4px rgba(234, 88, 12, 0.5);" class="px-3.5 py-1.5 rounded-2xl font-mono font-black text-xs flex flex-col items-center leading-tight">
          <span>${aqiVal}</span>
          <span class="text-[9px] font-bold tracking-wider opacity-90">AQI</span>
        </div>
        <div style="background-color: ${cardBg}; color: ${cardText}; border: 1px solid ${cardBorder};" class="text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm mt-1 whitespace-nowrap">
          ${safeArea}
        </div>
      </div>
    `;

    const marker = L.marker([rep.lat, rep.lng], {
      icon: L.divIcon({ html: iconHtml, className: 'custom-report-badge-marker', iconSize: [80, 50], iconAnchor: [40, 24] })
    });

    const consensusBadgeHtml = rep.consensusStatus === 'consensus_verified'
      ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">CONSENSUS VERIFIED [${rep.corroborationCount || 3} SOURCES]</span>`
      : `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">SINGLE SOURCE REPORT</span>`;

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[280px] text-xs">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span class="text-[10px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-400">Ground Truth Report</span>
          <span class="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">Weight: ${trustVal}x</span>
        </div>

        <div class="mb-2">
          ${consensusBadgeHtml}
        </div>

        <div class="text-sm font-bold text-slate-900 dark:text-white mb-0.5">${safeArea}</div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">By <span class="font-semibold text-slate-800 dark:text-slate-200">${safeReporter}</span> (${safeRole})</div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-3">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Visibility</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${visVal}m</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Burning Odor</div>
            <div class="text-xs font-bold text-orange-600 dark:text-orange-400">${safeSmell}</div>
          </div>
        </div>

        <div class="text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-orange-500 pl-3 py-1.5 mb-3 bg-orange-50/40 dark:bg-orange-950/20 rounded-r-xl">
          "${safeDesc}"
        </div>

        <button
          type="button"
          class="btn-native-share-report w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          data-report-id="${rep.id}"
        >
          Share Air Quality Card
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    layers.value.reports.addLayer(marker);

    if (visVal < 1000) {
      const circle = L.circle([rep.lat, rep.lng], {
        radius: visVal,
        color: '#ea580c',
        fillColor: '#ea580c',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '3, 3'
      });
      layers.value.reports.addLayer(circle);
    }
  }
}

function renderDivergences() {
  if (!layers.value?.divergence) return;
  layers.value.divergence.clearLayers();

  for (const div of props.divergences) {
    if (!div.isDivergent && (div.deltaAqi || 0) < 25) continue;

    const outerCircle = L.circle([div.lat, div.lng], {
      radius: 9000,
      color: '#eab308',
      fillColor: '#eab308',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 5'
    });

    const badgeIcon = L.divIcon({
      html: `
        <div class="flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2 cursor-pointer">
          <div class="relative px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-[10px] shadow-xl border border-amber-300 flex items-center gap-1.5 whitespace-nowrap pointer-events-auto">
            <span>+${div.deltaAqi} AQI Divergence</span>
          </div>
        </div>
      `,
      className: 'custom-divergence-pin',
      iconSize: [0, 0]
    });

    const safeStation = escapeText(div.stationName || 'Station');
    const safeReason = escapeText(div.reason || 'Local low-lying smoke trapped by humidity while elevated sensor shows lower values.');

    const popupHtml = `
      <div class="p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-2xl min-w-[260px] text-xs">
        <div class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">Reality Check Divergence</div>
        <div class="text-sm font-bold text-slate-900 dark:text-white mb-2">${safeStation}</div>
        <div class="space-y-1 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 mb-2">
          <div class="flex justify-between">
            <span class="text-slate-500">Official Sensor:</span>
            <span class="font-bold">${div.officialAqi} AQI</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Citizen Reports:</span>
            <span class="font-bold text-orange-600">${div.citizenAqi} AQI</span>
          </div>
          <div class="flex justify-between border-t border-amber-200/60 pt-1">
            <span class="font-semibold text-amber-900 dark:text-amber-200">Discrepancy:</span>
            <span class="font-mono font-bold text-red-600">+${div.deltaAqi} AQI</span>
          </div>
        </div>
        <div class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">${safeReason}</div>
      </div>
    `;

    const marker = L.marker([div.lat, div.lng], { icon: badgeIcon });
    marker.bindPopup(popupHtml);
    outerCircle.bindPopup(popupHtml);

    layers.value.divergence.addLayer(outerCircle);
    layers.value.divergence.addLayer(marker);
  }
}

function renderAllLayers() {
  renderOfficialMarkers();
  renderReportMarkers();
  renderAnomalies(layers.value?.anomalies, props.anomalyClusters, props.isDark);
  renderFirmsHotspots(layers.value?.hotspots, filteredHotspots.value, props.windData);
  renderWindGrid(layers.value?.wind, props.windData);
  renderDivergences();
}

function handleMapContainerClick(e) {
  const shareBtn = e.target.closest('.btn-native-share-report');
  if (shareBtn) {
    e.stopPropagation();
    e.preventDefault();
    const reportId = shareBtn.getAttribute('data-report-id');
    const rep = (props.reports || []).find(r => String(r.id) === String(reportId));
    if (rep) emit('share-report', rep);
    return;
  }

  const reportHereBtn = e.target.closest('.btn-report-here-action');
  if (reportHereBtn) {
    e.stopPropagation();
    e.preventDefault();
    const name = reportHereBtn.getAttribute('data-loc-name');
    const lat = parseFloat(reportHereBtn.getAttribute('data-loc-lat'));
    const lng = parseFloat(reportHereBtn.getAttribute('data-loc-lng'));
    emit('report-at-location', { areaName: name, lat, lng });
    return;
  }

  const syncStationBtn = e.target.closest('.btn-sync-station-action');
  if (syncStationBtn) {
    e.stopPropagation();
    e.preventDefault();
    const stationId = syncStationBtn.getAttribute('data-station-id');
    emit('open-sync-modal', stationId);
    return;
  }

  const forecastBtn = e.target.closest('.btn-forecast-station-action');
  if (forecastBtn) {
    e.stopPropagation();
    e.preventDefault();
    const stationId = forecastBtn.getAttribute('data-station-id');
    emit('open-forecast-modal', stationId);
    return;
  }

  const moeBtn = e.target.closest('.btn-moe-station-action');
  if (moeBtn) {
    e.stopPropagation();
    e.preventDefault();
    const stationId = moeBtn.getAttribute('data-station-id');
    emit('open-moe-modal', stationId);
    return;
  }

  const dismissBtn = e.target.closest('.btn-dismiss-search-pin');
  if (dismissBtn) {
    e.stopPropagation();
    e.preventDefault();
    if (searchLocationMarker && map.value) {
      map.value.removeLayer(searchLocationMarker);
      searchLocationMarker = null;
      currentSearchedLoc = null;
    }
    return;
  }

  const focusDriftBtn = e.target.closest('.btn-focus-hotspot-drift');
  if (focusDriftBtn) {
    e.stopPropagation();
    e.preventDefault();
    const lat = parseFloat(focusDriftBtn.getAttribute('data-lat'));
    const lng = parseFloat(focusDriftBtn.getAttribute('data-lng'));
    const endLat = parseFloat(focusDriftBtn.getAttribute('data-end-lat'));
    const endLng = parseFloat(focusDriftBtn.getAttribute('data-end-lng'));
    if (map.value && !isNaN(lat) && !isNaN(lng)) {
      const bounds = L.latLngBounds([[lat, lng], [endLat, endLng]]);
      map.value.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
      emit('toast', 'Zoomed into wind-blown smoke drift corridor');
    }
    return;
  }

  const reportHotspotBtn = e.target.closest('.btn-report-at-hotspot');
  if (reportHotspotBtn) {
    e.stopPropagation();
    e.preventDefault();
    const name = reportHotspotBtn.getAttribute('data-loc-name') || 'Hotspot Corridor';
    const lat = parseFloat(reportHotspotBtn.getAttribute('data-lat'));
    const lng = parseFloat(reportHotspotBtn.getAttribute('data-lng'));
    emit('report-at-location', { areaName: name, lat, lng });
    return;
  }
}

onMounted(() => {
  const mapInstance = initMap('jerebu-map');
  setTileLayer(props.isDark ? 'dark' : 'default', props.isDark);

  mapInstance.on('click', (e) => {
    if (props.isPickingLocation) {
      if (tempPickMarker) mapInstance.removeLayer(tempPickMarker);
      tempPickMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 12,
        fillColor: '#ea580c',
        color: '#ffffff',
        weight: 3.5,
        fillOpacity: 0.95
      }).addTo(mapInstance);

      emit('location-selected', {
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lng: parseFloat(e.latlng.lng.toFixed(5))
      });
    }
  });

  const container = mapInstance.getContainer();
  container.addEventListener('click', handleMapContainerClick);

  renderAllLayers();
  syncLayerVisibility(filters.value);
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (map.value) {
    const container = map.value.getContainer();
    if (container) {
      container.removeEventListener('click', handleMapContainerClick);
    }
  }
  destroyMap();
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeyDown);
});

watch(() => props.officialStations, () => renderOfficialMarkers(), { deep: true });
watch(() => props.reports, () => renderReportMarkers(), { deep: true });
watch(() => props.anomalyClusters, (clusters) => renderAnomalies(layers.value?.anomalies, clusters, props.isDark), { deep: true });
watch(() => [props.hotspots, hotspotFilters.value], () => renderFirmsHotspots(layers.value?.hotspots, filteredHotspots.value, props.windData), { deep: true });
watch(() => props.windData, (w) => renderWindGrid(layers.value?.wind, w), { deep: true });
watch(() => props.divergences, () => renderDivergences(), { deep: true });
watch(() => props.isDark, (dark) => {
  setTileLayer(dark ? 'dark' : 'default', dark);
  renderAllLayers();
});
watch(filters, (newVal) => {
  syncLayerVisibility(newVal);
}, { deep: true });

// Ensure map updates view bounds cleanly when left drawer transitions
watch(() => props.isLeftFeedVisible, () => {
  let count = 0;
  const interval = setInterval(() => {
    invalidateSize();
    count++;
    if (count > 7) clearInterval(interval);
  }, 50);
});

defineExpose({
  handleLocationSelected,
  filters,
  invalidateSize
});
</script>

<style scoped>
:deep(.custom-report-badge-marker),
:deep(.custom-official-pin),
:deep(.custom-anomaly-pin),
:deep(.custom-search-highlight-pin),
:deep(.custom-wind-vector-pin),
:deep(.custom-divergence-pin),
:deep(.custom-firms-hotspot-pin) {
  background: transparent;
  border: none;
}
</style>
