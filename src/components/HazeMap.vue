<template>
  <div class="relative w-full h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
    <!-- Map Canvas -->
    <div id="jerebu-map" class="w-full h-full z-0"></div>

    <!-- Central Floating Sarawak Geolocation Search Bar -->
    <div class="absolute top-3 sm:top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[410] w-auto sm:w-[480px] max-w-[calc(100vw-24px)]">
      <SarawakSearchBar
        @select-location="handleLocationSelected"
        @toast="$emit('toast', $event)"
      />
    </div>

    <!-- Hotspot Quick Jumps (Pushed down to prevent search bar collision) -->
    <div class="absolute top-20 sm:top-20 left-3 sm:left-4 z-[400] flex flex-wrap gap-1 p-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md max-w-[90vw] sm:max-w-none transition-colors duration-200">
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-2.5 py-1 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-orange-500"></span>
        Hotspots:
      </span>
      <button
        v-for="region in regions"
        :key="region.name"
        @click="flyToRegion(region)"
        :class="[
          'text-xs px-3 py-1 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap',
          activeRegion === region.name
            ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white font-semibold shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        ]"
      >
        {{ region.flag }} {{ region.name }}
      </button>
    </div>

    <!-- Dedicated Sleek Map Layer Control Panel (Pushed down accordingly) -->
    <div class="absolute top-34 sm:top-34 left-3 sm:left-4 z-[400]">
      <MapLayerControl
        v-model="filters"
        :official-count="officialStations.length"
        :report-count="reports.length"
        :anomaly-count="anomalyClusters.filter(a => a.isAnomaly).length"
      />
    </div>

    <!-- Map Click Picker Notification Banner -->
    <div
      v-if="isPickingLocation"
      class="absolute top-4 right-4 z-[400] bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 border border-slate-700 animate-bounce"
    >
      <span class="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
      <span>Click anywhere on map to position report</span>
      <button @click="$emit('cancel-pick')" class="ml-2 text-slate-400 hover:text-white underline cursor-pointer text-[11px]">Cancel</button>
    </div>

    <!-- Sleek Map Legend Card -->
    <div class="absolute bottom-24 right-4 sm:right-6 z-[400] bg-white dark:bg-slate-900/95 p-3.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 w-48 text-[11px] hidden sm:block transition-colors duration-200">
      <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">Map Legend</h3>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
          <div class="w-3 h-3 bg-emerald-500 rounded-full border border-white dark:border-slate-800 shadow-xs"></div>
          0–50 Good
        </div>
        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
          <div class="w-3 h-3 bg-amber-400 rounded-full border border-white dark:border-slate-800 shadow-xs"></div>
          51–100 Moderate
        </div>
        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
          <div class="w-3 h-3 bg-orange-500 rounded-full border border-white dark:border-slate-800 shadow-xs"></div>
          101–200 Unhealthy
        </div>
        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
          <div class="w-3 h-3 bg-red-600 rounded-full border border-white dark:border-slate-800 shadow-xs"></div>
          201+ Hazardous
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import L from 'leaflet';
import { getAQIColor } from '../data/officialStations.js';
import MapLayerControl from './MapLayerControl.vue';
import SarawakSearchBar from './SarawakSearchBar.vue';
import { calculateDistanceKm } from '../data/sarawakLocations.js';

const props = defineProps({
  officialStations: { type: Array, default: () => [] },
  reports: { type: Array, default: () => [] },
  anomalyClusters: { type: Array, default: () => [] },
  isPickingLocation: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false }
});

const emit = defineEmits([
  'location-selected',
  'cancel-pick',
  'select-report',
  'upvote-report',
  'share-report',
  'report-at-location',
  'toast'
]);

let map = null;
let tileLayerInstance = null;
let officialMarkersLayer = null;
let reportsMarkersLayer = null;
let anomalyOverlayLayer = null;
let tempPickMarker = null;
let searchLocationMarker = null;
let currentSearchedLoc = null;

const activeRegion = ref('Miri (Hotspot)');

const filters = ref({
  official: true,
  community: true,
  anomalies: true
});

const regions = [
  { name: 'Miri (Hotspot)', flag: '🇲🇾', lat: 4.450, lng: 114.020, zoom: 12 },
  { name: 'Kuching', flag: '🇲🇾', lat: 1.5533, lng: 110.3592, zoom: 12 },
  { name: 'Sibu', flag: '🇲🇾', lat: 2.2875, lng: 111.8305, zoom: 12 },
  { name: 'Bintulu', flag: '🇲🇾', lat: 3.1725, lng: 113.0433, zoom: 12 },
  { name: 'Sri Aman', flag: '🇲🇾', lat: 1.2333, lng: 111.4667, zoom: 12 },
  { name: 'Klang Valley', flag: '🇲🇾', lat: 3.100, lng: 101.620, zoom: 11 },
  { name: 'Riau Sumatra', flag: '🇮🇩', lat: 0.507, lng: 101.447, zoom: 9 }
];

function flyToRegion(region) {
  activeRegion.value = region.name;
  if (map) {
    map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.2 });
  }
}

function setTileLayer(isDark) {
  if (!map) return;
  if (tileLayerInstance) {
    map.removeLayer(tileLayerInstance);
  }
  
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  tileLayerInstance = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  if (tileLayerInstance.bringToBack) {
    tileLayerInstance.bringToBack();
  }
}

function syncLayers(currentFilters = filters.value) {
  if (!map) return;
  if (currentFilters.official) {
    if (officialMarkersLayer && !map.hasLayer(officialMarkersLayer)) map.addLayer(officialMarkersLayer);
  } else {
    if (officialMarkersLayer && map.hasLayer(officialMarkersLayer)) map.removeLayer(officialMarkersLayer);
  }

  if (currentFilters.community) {
    if (reportsMarkersLayer && !map.hasLayer(reportsMarkersLayer)) map.addLayer(reportsMarkersLayer);
  } else {
    if (reportsMarkersLayer && map.hasLayer(reportsMarkersLayer)) map.removeLayer(reportsMarkersLayer);
  }

  if (currentFilters.anomalies) {
    if (anomalyOverlayLayer && !map.hasLayer(anomalyOverlayLayer)) map.addLayer(anomalyOverlayLayer);
  } else {
    if (anomalyOverlayLayer && map.hasLayer(anomalyOverlayLayer)) map.removeLayer(anomalyOverlayLayer);
  }
}

onMounted(() => {
  initMap();
  renderAllLayers();
  syncLayers();
});

watch(() => props.officialStations, () => renderOfficialMarkers(), { deep: true });
watch(() => props.reports, () => renderReportMarkers(), { deep: true });
watch(() => props.anomalyClusters, () => renderAnomalyClusters(), { deep: true });
watch(() => props.isDark, (newVal) => {
  setTileLayer(newVal);
  renderAllLayers();
});

watch(filters, (newVal) => {
  syncLayers(newVal);
}, { deep: true });

function initMap() {
  map = L.map('jerebu-map', {
    center: [4.450, 114.020],
    zoom: 12,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  setTileLayer(props.isDark);

  officialMarkersLayer = L.layerGroup().addTo(map);
  reportsMarkersLayer = L.layerGroup().addTo(map);
  anomalyOverlayLayer = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    if (props.isPickingLocation) {
      if (tempPickMarker) map.removeLayer(tempPickMarker);
      tempPickMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 10,
        fillColor: '#ea580c',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0.95
      }).addTo(map);

      emit('location-selected', {
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lng: parseFloat(e.latlng.lng.toFixed(5))
      });
    }
  });

  map.getContainer().addEventListener('click', (e) => {
    const shareBtn = e.target.closest('.btn-native-share-report');
    if (shareBtn) {
      e.stopPropagation();
      e.preventDefault();
      const reportId = shareBtn.getAttribute('data-report-id');
      const rep = props.reports.find(r => String(r.id) === String(reportId));
      if (rep) {
        emit('share-report', rep);
      }
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

    const dismissBtn = e.target.closest('.btn-dismiss-search-pin');
    if (dismissBtn) {
      e.stopPropagation();
      e.preventDefault();
      if (searchLocationMarker && map) {
        map.removeLayer(searchLocationMarker);
        searchLocationMarker = null;
        currentSearchedLoc = null;
      }
      return;
    }
  });
}

function handleLocationSelected(loc) {
  if (!map) return;
  currentSearchedLoc = loc;

  map.flyTo([loc.lat, loc.lng], loc.zoom || 14, { duration: 1.4 });

  if (searchLocationMarker) {
    map.removeLayer(searchLocationMarker);
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
      <span class="absolute -top-1.5 -left-1.5 w-11 h-11 rounded-full bg-orange-500/40 animate-ping"></span>
      <span class="absolute -top-3 -left-3 w-14 h-14 rounded-full bg-orange-500/15 animate-pulse"></span>
      <div style="
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        border: 2.5px solid ${pinBorder};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 25px -3px rgba(234, 88, 12, 0.5);
      ">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
  `;

  const searchPinIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-search-highlight-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });

  searchLocationMarker = L.marker([loc.lat, loc.lng], { icon: searchPinIcon }).addTo(map);

  const nearestInfoHtml = nearestStation
    ? `
      <div class="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Nearest Station</span>
          <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">${minDistance} km away</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="font-bold text-slate-800 dark:text-slate-200 truncate mr-2">${nearestStation.name}</span>
          <span class="font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">${nearestStation.aqi} AQI</span>
        </div>
        <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${nearestStation.status} (${nearestStation.pm25} µg/m³ PM2.5)</div>
      </div>
    `
    : '';

  const popupHtml = `
    <div class="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[260px] max-w-[320px]">
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-[10px] font-bold px-2 py-0.5 bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 rounded-md uppercase">
          ${loc.division || 'Sarawak'}
        </span>
        <span class="text-[10px] font-mono text-slate-400">${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°</span>
      </div>
      <div class="text-base font-black text-slate-800 dark:text-slate-100 leading-snug">${loc.name}</div>
      ${loc.description ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">${loc.description}</div>` : ''}
      
      ${nearestInfoHtml}

      <div class="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          class="btn-report-here-action flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold text-center cursor-pointer shadow-sm transition-all"
          data-loc-name="${loc.name}"
          data-loc-lat="${loc.lat}"
          data-loc-lng="${loc.lng}"
        >
          📝 Report Haze Here
        </button>
        <button
          type="button"
          class="btn-dismiss-search-pin py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          title="Dismiss pin"
        >
          ✕
        </button>
      </div>
    </div>
  `;

  searchLocationMarker.bindPopup(popupHtml, { maxWidth: 320 }).openPopup();
  emit('toast', `📍 Centered map on ${loc.name} (${loc.division || 'Sarawak'})`);
}

function renderAllLayers() {
  renderOfficialMarkers();
  renderReportMarkers();
  renderAnomalyClusters();
}

function renderOfficialMarkers() {
  if (!officialMarkersLayer) return;
  officialMarkersLayer.clearLayers();

  const isDark = props.isDark;
  const badgeBorder = isDark ? '#0f172a' : '#ffffff';
  const labelBg = isDark ? '#0f172a' : '#ffffff';
  const labelText = isDark ? '#f8fafc' : '#1e293b';
  const labelBorder = isDark ? '#334155' : '#e2e8f0';

  for (const st of props.officialStations) {
    const colorInfo = getAQIColor(st.aqi);

    const iconHtml = `
      <div class="flex flex-col items-center">
        <div style="
          background-color: ${colorInfo.bg};
          color: #ffffff;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3.5px solid ${badgeBorder};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25);
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 13px;
        ">
          ${st.aqi}
        </div>
        <div style="
          background-color: ${labelBg};
          color: ${labelText};
          border: 1px solid ${labelBorder};
        " class="px-2 py-0.5 rounded-md shadow-xs text-[10px] font-bold mt-1 whitespace-nowrap">
          ${st.city || st.name.split(' ')[0]}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-official-pin',
      iconSize: [60, 60],
      iconAnchor: [30, 21]
    });

    const marker = L.marker([st.lat, st.lng], { icon: customIcon });

    const popupHtml = `
      <div class="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[260px]">
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">Official Station</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full font-bold" style="background:${colorInfo.bg}22; color:${colorInfo.bg}; border: 1px solid ${colorInfo.bg}44;">${colorInfo.label}</span>
        </div>
        <div class="text-base font-bold text-slate-800 dark:text-slate-100 mb-0.5">${st.name}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">${st.source}</div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-3">
          <div>
            <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-semibold">Reading (AQI)</div>
            <div class="text-2xl font-mono font-bold" style="color: ${colorInfo.bg}">${st.aqi}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-semibold">PM2.5 Conc.</div>
            <div class="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">${st.pm25} <span class="text-[10px] font-normal text-slate-400">µg/m³</span></div>
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">${st.description}</div>
        <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Updated: ${st.updatedAt} • Redis Cache TTL Active</div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    officialMarkersLayer.addLayer(marker);
  }
  syncLayers();
}

function renderReportMarkers() {
  if (!reportsMarkersLayer) return;
  reportsMarkersLayer.clearLayers();

  const isDark = props.isDark;
  const pinBorder = isDark ? 'border-slate-900' : 'border-white';
  const badgeClass = isDark ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-900 text-white';

  for (const rep of props.reports) {
    const isHigh = rep.estimatedAqi >= 150;

    const iconHtml = `
      <div class="flex flex-col items-center cursor-pointer group">
        <div class="w-9 h-9 rounded-full bg-orange-500 text-white border-3 ${pinBorder} shadow-md flex items-center justify-center font-bold text-xs ${isHigh ? 'animate-pulse' : ''}">
          <span>🔥</span>
        </div>
        <div class="${badgeClass} font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow mt-0.5 whitespace-nowrap">
          ${rep.estimatedAqi} AQI
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-report-pin',
      iconSize: [48, 48],
      iconAnchor: [24, 18]
    });

    const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });

    const symptomsHtml = (rep.symptoms || [])
      .map(s => `<span class="inline-block px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-[10px] font-semibold mr-1 mb-1">${s}</span>`)
      .join('');

    const popupHtml = `
      <div class="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[280px]">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span class="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400">Ground Truth Report</span>
          <span class="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">Weight: ${rep.trustScore}x</span>
        </div>

        <div class="text-base font-bold text-slate-800 dark:text-slate-100 mb-0.5">${rep.areaName}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">By <span class="text-slate-800 dark:text-slate-200 font-medium">${rep.reporterName}</span> (${rep.reporterRole})</div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-3">
          <div>
            <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-semibold">Visibility</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${rep.visibilityLabel}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-semibold">Burning Odor</div>
            <div class="text-xs font-bold text-orange-700 dark:text-orange-400">${rep.smellLevel}</div>
          </div>
        </div>

        <div class="text-xs text-slate-700 dark:text-slate-200 italic border-l-2 border-orange-500 pl-2.5 py-1 mb-3 bg-orange-50/50 dark:bg-orange-950/30 rounded-r">
          "${rep.description}"
        </div>

        <div class="mb-3">
          <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-semibold mb-1">Reported Symptoms:</div>
          <div class="flex flex-wrap">${symptomsHtml || '<span class="text-xs text-slate-400">None</span>'}</div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px] text-slate-400 dark:text-slate-400">
          <span>${rep.timestamp}</span>
          <span class="text-orange-600 dark:text-orange-400 font-bold font-mono">Panic Index: ${rep.panicScore}%</span>
        </div>

        <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="btn-native-share-report flex items-center justify-center gap-2 w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
            data-report-id="${rep.id}"
            title="Generate air quality image and share"
          >
            <svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
            <span>Share Air Quality Status</span>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    reportsMarkersLayer.addLayer(marker);

    if (rep.visibilityMeters < 1000) {
      const circle = L.circle([rep.lat, rep.lng], {
        radius: rep.visibilityMeters,
        color: '#ea580c',
        fillColor: '#ea580c',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '3, 3'
      });
      reportsMarkersLayer.addLayer(circle);
    }
  }
  syncLayers();
}

function renderAnomalyClusters() {
  if (!anomalyOverlayLayer) return;
  anomalyOverlayLayer.clearLayers();

  const isDark = props.isDark;
  const areaBg = isDark ? '#0f172a' : 'rgba(255, 255, 255, 0.95)';
  const areaText = isDark ? '#f8fafc' : '#1e293b';
  const areaBorder = isDark ? '#334155' : '#e2e8f0';

  for (const anomaly of props.anomalyClusters) {
    if (!anomaly.isAnomaly) continue;

    const outerCircle = L.circle(anomaly.center, {
      className: 'animate-haze-pulse',
      radius: anomaly.radiusMeters,
      color: '#ea580c',
      fillColor: '#f97316',
      fillOpacity: isDark ? 0.28 : 0.22,
      weight: 2.5,
      dashArray: '5, 5'
    });

    const innerCircle = L.circle(anomaly.center, {
      className: 'animate-haze-pulse',
      radius: Math.max(Math.round(anomaly.radiusMeters * 0.45), 750),
      color: '#dc2626',
      fillColor: '#ef4444',
      fillOpacity: isDark ? 0.45 : 0.35,
      weight: 2
    });

    const popupHtml = `
      <div class="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-orange-200 dark:border-orange-800/80 min-w-[280px]">
        <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 text-orange-600 dark:text-orange-400">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span class="text-xs font-bold uppercase tracking-wider">FastAPI DBSCAN Spike</span>
        </div>
        <div class="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">High-Risk Smoke Zone: ${anomaly.area}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">${anomaly.reportCount} localized citizen reports confirm intense ground-level haze.</div>

        <div class="bg-orange-50/80 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 rounded-xl p-2.5 mb-3 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Citizen Weighted AQI:</span>
            <span class="font-mono font-bold text-orange-950 dark:text-orange-300">${anomaly.groundTruthAqi}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Nearest Gov Station:</span>
            <span class="font-mono font-bold text-emerald-700 dark:text-emerald-400">${anomaly.nearestStation?.name} (${anomaly.nearestStation?.aqi || 'N/A'})</span>
          </div>
          <div class="flex justify-between border-t border-orange-200/60 dark:border-orange-800/60 pt-1 font-semibold">
            <span class="text-orange-900 dark:text-orange-300">Sensor Blindspot Discrepancy:</span>
            <span class="font-mono text-red-600 dark:text-red-400 font-extrabold">+${anomaly.discrepancy} AQI</span>
          </div>
        </div>

        <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Algorithm: Epsilon = ${anomaly.parameters.epsKm}km, MinSamples = ${anomaly.parameters.minPts}, WeightThreshold = ${anomaly.parameters.weightThreshold}x
        </div>
      </div>
    `;

    outerCircle.bindPopup(popupHtml);
    innerCircle.bindPopup(popupHtml);

    const centerIcon = L.divIcon({
      className: 'custom-anomaly-pin',
      html: `
        <div class="flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
          <div class="w-14 h-14 rounded-full bg-red-500/25 border-2 border-red-500 animate-haze-pulse pointer-events-auto"></div>
          <div class="relative -mt-9 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold shadow-md border border-slate-700 flex items-center gap-1.5 whitespace-nowrap pointer-events-auto">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            <span>SPIKE +${anomaly.discrepancy} AQI</span>
          </div>
          <div style="background-color: ${areaBg}; color: ${areaText}; border: 1px solid ${areaBorder};" class="text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs mt-1 whitespace-nowrap pointer-events-auto">
            ${anomaly.area}
          </div>
        </div>
      `,
      iconSize: [0, 0]
    });

    const centerMarker = L.marker(anomaly.center, { icon: centerIcon });
    centerMarker.bindPopup(popupHtml);

    anomalyOverlayLayer.addLayer(outerCircle);
    anomalyOverlayLayer.addLayer(innerCircle);
    anomalyOverlayLayer.addLayer(centerMarker);
  }
  syncLayers();
}
</script>

<style scoped>
:deep(.custom-report-pin) {
  background: transparent;
  border: none;
}
:deep(.custom-official-pin) {
  background: transparent;
  border: none;
}
:deep(.custom-anomaly-pin) {
  background: transparent;
  border: none;
}
</style>
