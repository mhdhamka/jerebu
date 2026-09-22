<template>
  <div class="relative w-full select-none" ref="searchContainerRef">
    <!-- Main Search Bar Input Box -->
    <div
      :class="[
        'flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300',
        isFocused
          ? 'bg-white dark:bg-slate-900 border-orange-500 dark:border-orange-500 ring-4 ring-orange-500/10 shadow-orange-500/5'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      ]"
    >
      <!-- Search Icon -->
      <div class="text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-center transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Text Input -->
      <input
        ref="inputRef"
        type="text"
        v-model="query"
        @focus="handleFocus"
        @keydown.down.prevent="navigateResults(1)"
        @keydown.up.prevent="navigateResults(-1)"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc.prevent="closeDropdown"
        placeholder="Search city, town, or neighborhood in Sarawak..."
        class="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none tracking-tight"
      />

      <!-- Clear Query Button -->
      <button
        v-if="query"
        @click="clearQuery"
        type="button"
        class="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Clear Search"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Keyboard Shortcut Hint -->
      <span
        v-if="!query && !isFocused"
        class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/80 shadow-2xs"
      >
        /
      </span>

      <!-- Divider -->
      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>

      <!-- GPS Geolocation Button -->
      <button
        type="button"
        @click="locateDeviceGPS"
        :disabled="isLocatingGPS"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
        :class="[
          isLocatingGPS
            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
        ]"
        title="Use Device GPS Geolocation to Center Map"
      >
        <span v-if="isLocatingGPS" class="w-3 h-3 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
        <svg v-else class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="hidden sm:inline">{{ isLocatingGPS ? 'Locating...' : 'GPS' }}</span>
      </button>
    </div>

    <!-- Dropdown Results Container -->
    <div
      v-if="isDropdownOpen"
      class="absolute left-0 right-0 top-full mt-2.5 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-[500] max-h-[75vh] flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <!-- Quick Division Jump Bar with Left/Right Scroll Toggles -->
      <div class="p-2.5 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div class="flex items-center justify-between mb-1.5 px-1">
          <span class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
            Sarawak Administrative Divisions
          </span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 mr-1">12 Divisions</span>
            <!-- Left Scroll Button -->
            <button
              type="button"
              @click="scrollDivisions(-1)"
              class="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-all cursor-pointer shadow-2xs"
              title="Scroll Left"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <!-- Right Scroll Button -->
            <button
              type="button"
              @click="scrollDivisions(1)"
              class="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-all cursor-pointer shadow-2xs"
              title="Scroll Right"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Scrollable Divisions Container -->
        <div ref="divsScrollContainerRef" class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          <button
            v-for="div in divisions"
            :key="div.id"
            @click="selectDivision(div)"
            type="button"
            class="px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 shadow-2xs shrink-0"
          >
            {{ div.flagName }}
          </button>
        </div>
      </div>

      <!-- Results List -->
      <div class="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
        <!-- Device GPS Quick Action Row -->
        <button
          type="button"
          @click="locateDeviceGPS"
          class="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer group"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-bold text-emerald-800 dark:text-emerald-300 group-hover:underline">
                Use Current Device GPS Geolocation
              </div>
              <div class="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Center map directly on your live coordinates in Sarawak
              </div>
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-900/60 rounded-lg">
            Live
          </span>
        </button>

        <!-- Loading State for Online Geocode -->
        <div v-if="isGeocodingOnline" class="p-3 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <span class="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <span>Searching OpenStreetMap Sarawak geospatial database...</span>
        </div>

        <!-- Matched Items -->
        <template v-if="searchResults.length > 0">
          <div
            v-for="(item, index) in searchResults"
            :key="item.name + item.lat"
            @click="selectLocation(item)"
            :class="[
              'px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors',
              highlightedIndex === index
                ? 'bg-orange-50/90 dark:bg-orange-950/40 border-l-3 border-orange-500'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <!-- Location Type Icon -->
              <div class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs" :class="getTypeBadgeClass(item.type)">
                <span>{{ getTypeIcon(item.type) }}</span>
              </div>

              <!-- Name & Division -->
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                  <span>{{ item.name }}</span>
                  <span
                    v-if="item.source === 'OpenStreetMap'"
                    class="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-normal shrink-0"
                  >
                    OSM
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-2 mt-0.5">
                  <span class="font-medium text-slate-500 dark:text-slate-400">{{ item.division }}</span>
                  <span class="text-slate-300 dark:text-slate-700">•</span>
                  <span class="font-mono text-[9px]">{{ item.lat.toFixed(3) }}°, {{ item.lng.toFixed(3) }}°</span>
                </div>
              </div>
            </div>

            <!-- Type Pill -->
            <div class="shrink-0 ml-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                {{ formatType(item.type) }}
              </span>
            </div>
          </div>
        </template>

        <!-- No Results Fallback -->
        <div v-else-if="query && !isGeocodingOnline" class="p-6 text-center text-slate-500 dark:text-slate-400">
          <div class="text-2xl mb-1"></div>
          <div class="text-xs font-bold text-slate-700 dark:text-slate-200">No exact match found for "{{ query }}" in Sarawak</div>
          <div class="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            Try searching for a major town (e.g. Sibu, Bintulu, Miri) or select a division chip above.
          </div>
        </div>

        <!-- Featured Locations when blank -->
        <div v-if="!query && searchResults.length === 0" class="p-3">
          <div class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 px-1">
            Featured Sarawak Cities & Neighborhoods
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              v-for="featured in featuredLocations"
              :key="featured.name"
              type="button"
              @click="selectLocation(featured)"
              class="p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div class="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate">
                {{ featured.name }}
              </div>
              <div class="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {{ featured.division }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Dropdown Footer -->
      <div class="px-3.5 py-2 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between shrink-0">
        <span>Coverage across all 12 Sarawak Divisions</span>
        <span class="hidden sm:inline font-mono">Use ↑↓ to navigate • Enter to select</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  SARAWAK_DIVISIONS,
  SARAWAK_LOCATIONS,
  searchSarawakLocations,
  geocodeSarawakNominatim
} from '../data/sarawakLocations.js';

const emit = defineEmits(['select-location', 'gps-located', 'toast']);

const query = ref('');
const isFocused = ref(false);
const isDropdownOpen = ref(false);
const isLocatingGPS = ref(false);
const isGeocodingOnline = ref(false);
const highlightedIndex = ref(0);

const searchContainerRef = ref(null);
const inputRef = ref(null);
const divsScrollContainerRef = ref(null);

const divisions = SARAWAK_DIVISIONS;

const featuredLocations = computed(() => {
  const targets = ['Senadin', 'Petra Jaya', 'Sibu Jaya', 'Tanjung Kidurong & Deepwater Port', 'Kota Samarahan', 'Sri Aman Town (Simanggang)'];
  return SARAWAK_LOCATIONS.filter(loc => targets.includes(loc.name));
});

const searchResults = ref([]);
let debounceTimer = null;

async function performSearch(val) {
  if (!val || val.trim().length === 0) {
    searchResults.value = [];
    isGeocodingOnline.value = false;
    return;
  }

  const localMatches = searchSarawakLocations(val, 8);
  searchResults.value = localMatches;
  highlightedIndex.value = 0;

  if (val.trim().length >= 3) {
    isGeocodingOnline.value = true;
    try {
      const onlineMatches = await geocodeSarawakNominatim(val);
      const existingNames = new Set(localMatches.map(m => m.name.toLowerCase()));
      const uniqueOnline = onlineMatches.filter(m => !existingNames.has(m.name.toLowerCase()));
      searchResults.value = [...localMatches, ...uniqueOnline].slice(0, 10);
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      isGeocodingOnline.value = false;
    }
  }
}

watch(query, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performSearch(newVal);
  }, 220);
});

function handleFocus() {
  isFocused.value = true;
  isDropdownOpen.value = true;
}

function closeDropdown() {
  isDropdownOpen.value = false;
  isFocused.value = false;
}

function clearQuery() {
  query.value = '';
  searchResults.value = [];
  inputRef.value?.focus();
}

function selectDivision(div) {
  emit('select-location', {
    name: div.name,
    division: div.name,
    type: 'division',
    lat: div.lat,
    lng: div.lng,
    zoom: div.zoom,
    description: div.description
  });
  query.value = div.flagName;
  closeDropdown();
}

/**
 * Scroll divisions left or right when arrow buttons are clicked
 */
function scrollDivisions(direction) {
  if (divsScrollContainerRef.value) {
    divsScrollContainerRef.value.scrollBy({
      left: direction * 180,
      behavior: 'smooth'
    });
  }
}

function selectLocation(loc) {
  emit('select-location', {
    name: loc.name,
    division: loc.division,
    type: loc.type || 'location',
    lat: loc.lat,
    lng: loc.lng,
    zoom: loc.zoom || 14,
    source: loc.source || 'Local Database'
  });
  query.value = loc.name;
  closeDropdown();
}

function selectHighlighted() {
  if (searchResults.value.length > 0 && highlightedIndex.value >= 0 && highlightedIndex.value < searchResults.value.length) {
    selectLocation(searchResults.value[highlightedIndex.value]);
  } else if (query.value.trim().length > 0) {
    performSearch(query.value);
  }
}

function navigateResults(direction) {
  if (!isDropdownOpen.value) {
    isDropdownOpen.value = true;
    return;
  }
  const total = searchResults.value.length;
  if (total === 0) return;
  highlightedIndex.value = (highlightedIndex.value + direction + total) % total;
}

function locateDeviceGPS() {
  if (!navigator.geolocation) {
    emit('toast', 'Geolocation is not supported by your browser.');
    return;
  }

  isLocatingGPS.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      isLocatingGPS.value = false;
      const lat = parseFloat(position.coords.latitude.toFixed(5));
      const lng = parseFloat(position.coords.longitude.toFixed(5));

      const inSarawak = lat >= 0.8 && lat <= 5.0 && lng >= 109.5 && lng <= 115.8;
      const locationLabel = inSarawak ? 'Current GPS Location (Sarawak)' : 'Current Device GPS Location';

      emit('select-location', {
        name: locationLabel,
        division: inSarawak ? 'Sarawak' : 'Detected GPS Position',
        type: 'gps_device',
        lat,
        lng,
        zoom: 15,
        isDeviceGPS: true
      });

      query.value = inSarawak ? 'My GPS Position (Sarawak)' : `GPS: ${lat}, ${lng}`;
      closeDropdown();
      emit('toast', `📍 Centered map on device GPS: ${lat}, ${lng}`);
    },
    (err) => {
      isLocatingGPS.value = false;
      let msg = 'Unable to retrieve your location.';
      if (err.code === 1) msg = 'Location access was denied. Please allow location permissions in your browser.';
      else if (err.code === 2) msg = 'Position unavailable. Check your network or GPS signal.';
      else if (err.code === 3) msg = 'Location request timed out.';
      emit('toast', msg);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

function handleClickOutside(e) {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target)) {
    closeDropdown();
  }
}

function handleGlobalKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
    e.preventDefault();
    inputRef.value?.focus();
    isDropdownOpen.value = true;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleGlobalKeydown);
});

function getTypeIcon(type) {
  switch (type) {
    case 'city': return '🏙️';
    case 'neighborhood': return '🏘️';
    case 'town': return '🏡';
    case 'landmark': return '📍';
    case 'industrial': return '🏭';
    case 'district': return '🗺️';
    case 'division': return '🌐';
    case 'online_geocode': return '🔍';
    default: return '📍';
  }
}

function getTypeBadgeClass(type) {
  switch (type) {
    case 'city': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case 'neighborhood': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    case 'town': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    case 'landmark': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    case 'industrial': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    case 'online_geocode': return 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}

function formatType(type) {
  if (!type) return 'Location';
  return type.replace('_', ' ');
}
</script>