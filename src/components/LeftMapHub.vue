<template>
  <div class="relative select-none z-[450]" ref="containerRef">
    <!-- Collapsed Floating Button (Symmetrical to Control Hub on the right) -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/10 text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 group"
      :class="isOpen ? 'ring-2 ring-orange-500/50 border-orange-500/60' : ''"
      title="Toggle Map & Data Hub (Layers, Hotspots, Feeds)"
    >
      <div class="relative flex items-center justify-center w-5 h-5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <span
          v-if="activeLayerCount > 0"
          class="absolute -top-1.5 -right-2 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center font-black shadow-xs"
        >
          {{ activeLayerCount }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="font-extrabold tracking-tight">Map Hub</span>
        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">({{ activeLayerCount }}/{{ totalLayersCount }})</span>
      </div>

      <!-- Quick Active Region Badge (Desktop) -->
      <div class="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
        <span>{{ currentRegion?.flag || '🔥' }}</span>
        <span class="max-w-[90px] truncate font-semibold">{{ currentRegion?.name || 'Hotspots' }}</span>
      </div>

      <svg
        class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-0.5"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Expanded Unified Hub Flyout Panel -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 top-12 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-140px)] overflow-hidden text-slate-800 dark:text-slate-100"
      >
        <!-- Pinned Header -->
        <div class="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black tracking-tight text-slate-900 dark:text-white">Map & Data Hub</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                {{ activeLayerCount }}/{{ totalLayersCount }} Active
              </span>
            </div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Toggle with keys 1–6 or click below</p>
          </div>
          <button
            @click="isOpen = false"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Panel"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Body with Clean Inset Scrollbar -->
        <div class="p-4 sm:p-5 pt-3 overflow-y-auto flex-1 flex flex-col gap-4 custom-hub-scrollbar pr-3">
          <!-- 1. Live Community Feed Trigger Card -->
          <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-3 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-900 dark:text-white">Citizen Ground Reports</div>
                <div class="text-[10px] text-orange-700 dark:text-orange-400 font-medium">{{ reportCount }} Verified Field Reports</div>
              </div>
            </div>
            <button
              type="button"
              @click="$emit('toggle-feed'); isOpen = false;"
              class="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {{ isLeftFeedVisible ? 'Hide Feed' : 'Open Feed' }}
            </button>
          </div>

          <!-- 2. Map Data Layers with 1-6 Shortcut Badges -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                Data Layers (Keys 1–6)
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="setPreset('all')"
                  class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  @click="setPreset('official')"
                  class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Official
                </button>
                <button
                  type="button"
                  @click="setPreset('community')"
                  class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Reports
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <!-- Layer 1: Official Stations -->
              <div
                @click="toggleLayer('official')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.official ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-emerald-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    1
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Official AQI Data</div>
                    <div class="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">APIMS, NEA & BMKG ({{ officialCount }})</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.official ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.official ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>

              <!-- Layer 2: Community Reports -->
              <div
                @click="toggleLayer('community')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.community ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-orange-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    2
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Community Ground Truth</div>
                    <div class="text-[10px] text-orange-700 dark:text-orange-400 font-medium">Citizen Field Reports ({{ reportCount }})</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.community ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.community ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>

              <!-- Layer 3: DBSCAN Anomaly Clusters -->
              <div
                @click="toggleLayer('anomalies')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.anomalies ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    3
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">DBSCAN Anomalies</div>
                    <div class="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Pulsing Hazard Zones ({{ anomalyCount }})</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.anomalies ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.anomalies ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>

              <!-- Layer 4: NASA FIRMS Satellite Fire Hotspots -->
              <div
                @click="toggleLayer('hotspots')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.hotspots ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    4
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">NASA FIRMS Hotspots</div>
                    <div class="text-[10px] text-rose-700 dark:text-rose-400 font-medium">VIIRS / MODIS Satellite Detections ({{ hotspotCount }})</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.hotspots ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.hotspots ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>

              <!-- Layer 5: Wind Particles & Drift Vectors -->
              <div
                @click="toggleLayer('wind')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.wind ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-cyan-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    5
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Wind & Plume Vectors</div>
                    <div class="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium">{{ windSpeed }} km/h from {{ windDirection }}</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.wind ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.wind ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>

              <!-- Layer 6: Sensor Reality Divergence -->
              <div
                @click="toggleLayer('divergence')"
                class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer"
                :class="modelValue.divergence ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60' : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-md bg-amber-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-2xs">
                    6
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Reality Check Divergence</div>
                    <div class="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Sensor Gap Clusters ({{ divergenceCount }})</div>
                  </div>
                </div>
                <div
                  class="relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                  :class="modelValue.divergence ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                    :class="modelValue.divergence ? 'translate-x-3.5' : 'translate-x-0'"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Regional Hotspot Focus Navigator -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                Hotspot Focus Navigator
              </span>
              <span class="text-[10px] text-slate-400 font-mono">1-click fly to</span>
            </div>

            <div class="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 custom-hub-scrollbar">
              <button
                v-for="region in regions"
                :key="region.name"
                type="button"
                @click="$emit('select-region', region)"
                :class="[
                  'p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border',
                  activeRegion === region.name
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                ]"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <span>{{ region.flag }}</span>
                  <span class="truncate">{{ region.name }}</span>
                </span>
                <span v-if="activeRegion === region.name" class="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
              </button>
            </div>
          </div>

          <!-- 4. NASA FIRMS Satellite Fire Engine Section -->
          <div class="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl space-y-2 shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span class="text-xs font-bold text-slate-900 dark:text-white">NASA FIRMS Engine</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                {{ totalVisibleFrp }} MW FRP
              </span>
            </div>

            <div class="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>{{ visibleHotspotsCount }} Fire Detections active</span>
              <span class="text-[10px] font-mono text-slate-400">VIIRS 375m &bull; MODIS</span>
            </div>

            <button
              type="button"
              @click="$emit('sync-firms')"
              :disabled="isFirmsSyncing"
              class="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <span v-if="isFirmsSyncing" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ isFirmsSyncing ? 'Syncing FIRMS...' : 'Sync Live Satellite Feeds' }}</span>
            </button>
          </div>
        </div>

        <!-- 5. Pinned Keyboard Shortcuts Footer Guide -->
        <div class="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>Shortcuts: <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-slate-600 dark:text-slate-300 shadow-2xs">1-6</kbd> Toggle &bull; <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-slate-600 dark:text-slate-300 shadow-2xs">/</kbd> Search</span>
          <button
            type="button"
            @click="toggleAll(activeLayerCount === 0)"
            class="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
          >
            {{ activeLayerCount === 0 ? 'Show All' : 'Hide All' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ official: true, community: true, anomalies: true, hotspots: true, wind: true, divergence: true })
  },
  officialCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  anomalyCount: { type: Number, default: 0 },
  hotspotCount: { type: Number, default: 0 },
  divergenceCount: { type: Number, default: 0 },
  windSpeed: { type: Number, default: 14.5 },
  windDirection: { type: String, default: 'SW' },
  visibleHotspotsCount: { type: Number, default: 0 },
  totalVisibleFrp: { type: Number, default: 0 },
  isFirmsSyncing: { type: Boolean, default: false },
  regions: { type: Array, default: () => [] },
  activeRegion: { type: String, default: 'Miri (Hotspot)' },
  isLeftFeedVisible: { type: Boolean, default: false }
});

const emit = defineEmits([
  'update:modelValue',
  'toggle-feed',
  'select-region',
  'sync-firms',
  'toast'
]);

const isOpen = ref(false);
const containerRef = ref(null);
const totalLayersCount = 6;

const activeLayerCount = computed(() => {
  let count = 0;
  if (props.modelValue.official) count++;
  if (props.modelValue.community) count++;
  if (props.modelValue.anomalies) count++;
  if (props.modelValue.hotspots) count++;
  if (props.modelValue.wind) count++;
  if (props.modelValue.divergence) count++;
  return count;
});

const currentRegion = computed(() => {
  return props.regions.find(r => r.name === props.activeRegion) || props.regions[0] || null;
});

function toggleLayer(layerKey) {
  emit('update:modelValue', {
    ...props.modelValue,
    [layerKey]: !props.modelValue[layerKey]
  });
}

function setPreset(presetName) {
  switch (presetName) {
    case 'all':
      emit('update:modelValue', { official: true, community: true, anomalies: true, hotspots: true, wind: true, divergence: true });
      break;
    case 'official':
      emit('update:modelValue', { official: true, community: false, anomalies: false, hotspots: false, wind: false, divergence: false });
      break;
    case 'community':
      emit('update:modelValue', { official: false, community: true, anomalies: false, hotspots: false, wind: false, divergence: false });
      break;
  }
}

function toggleAll(showAll) {
  emit('update:modelValue', {
    official: showAll,
    community: showAll,
    anomalies: showAll,
    hotspots: showAll,
    wind: showAll,
    divergence: showAll
  });
}

function handleClickOutside(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-hub-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}

.custom-hub-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-hub-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 6px 0;
}

.custom-hub-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 9999px;
}

.custom-hub-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(249, 115, 22, 0.6);
}
</style>
