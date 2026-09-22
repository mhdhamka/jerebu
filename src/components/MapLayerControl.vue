<template>
  <div
    class="z-[400] transition-all duration-300 ease-out select-none"
    :class="[
      isExpanded
        ? 'w-72 sm:w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 p-4 transition-colors'
        : 'w-auto'
    ]"
  >
    <!-- Collapsed Floating Button State -->
    <button
      v-if="!isExpanded"
      @click="isExpanded = true"
      class="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-900/5 text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 group"
      title="Toggle Map Data Layers"
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
      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">({{ activeLayerCount }}/3)</span>
    </button>

    <!-- Expanded Control Panel -->
    <div v-else class="flex flex-col space-y-3.5">
      <!-- Panel Header -->
      <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div class="flex items-center gap-2.5">
          <div>
            <h3 class="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-tight">Map Layer Controls</h3>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{{ activeLayerCount }} of 3 layers active</span>
          </div>
        </div>
        <button
          @click="isExpanded = false"
          class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Minimize Panel"
        >
          <svg class="w-4 h-4 transition-transform hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Quick Preset View Modes -->
      <div>
        <div class="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center justify-between">
          <span>Quick Presets</span>
          <span class="text-[9px] text-slate-400 font-mono lowercase">1-click filter</span>
        </div>
        <div class="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl text-[10px] font-semibold border border-slate-200/50 dark:border-slate-800">
          <button
            type="button"
            @click="setPreset('all')"
            :class="[
              'py-1 px-1 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold ring-1 ring-slate-200/50 dark:ring-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            All
          </button>
          <button
            type="button"
            @click="setPreset('official')"
            :class="[
              'py-1 px-1 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'official'
                ? 'bg-emerald-500 text-white shadow-sm font-bold shadow-emerald-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Official
          </button>
          <button
            type="button"
            @click="setPreset('community')"
            :class="[
              'py-1 px-1 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'community'
                ? 'bg-orange-500 text-white shadow-sm font-bold shadow-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Reports
          </button>
          <button
            type="button"
            @click="setPreset('anomalies')"
            :class="[
              'py-1 px-1 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'anomalies'
                ? 'bg-blue-600 text-white shadow-sm font-bold shadow-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Spikes
          </button>
        </div>
      </div>

      <!-- Layer Stack Toggles -->
      <div class="space-y-2">
        <!-- Layer 1: Official AQI Stations Toggle -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-700"
          :class="[
            modelValue.official
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Official AQI Data</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  APIMS, NEA & BMKG ({{ officialCount }})
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('official')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.official ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.official ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Layer 2: Citizen Ground Truth Reports Toggle -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-700"
          :class="[
            modelValue.community
              ? 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-200/80 dark:border-orange-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>User Ground Reports</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Crowdsourced observations ({{ reportCount }})
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('community')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.community ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.community ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Layer 3: DBSCAN Anomaly Clusters Toggle -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
          :class="[
            modelValue.anomalies
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>DBSCAN Anomalies</span>
                </div>
                <div class="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                  Pulsing Hazard Zones ({{ anomalyCount }})
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('anomalies')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.anomalies ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.anomalies ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Layer 4: NASA FIRMS Satellite Fire Hotspots -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-rose-300 dark:hover:border-rose-700"
          :class="[
            modelValue.hotspots
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>NASA FIRMS Hotspots</span>
                </div>
                <div class="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                  VIIRS & MODIS Satellites ({{ hotspotCount }})
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('hotspots')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.hotspots ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.hotspots ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Layer 5: Live Wind Vector & Smoke Drift -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-cyan-300 dark:hover:border-cyan-700"
          :class="[
            modelValue.wind
              ? 'bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Wind & Smoke Drift</span>
                </div>
                <div class="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium">
                  {{ windDirection }} • {{ windSpeed }} km/h
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('wind')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.wind ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.wind ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Layer 6: Reality Check (Sensor Divergence) -->
        <div
          class="p-2.5 rounded-xl border transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-700"
          :class="[
            modelValue.divergence
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60 shadow-xs'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Sensor Divergence</span>
                </div>
                <div class="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  Reality Check Clusters ({{ divergenceCount }})
                </div>
              </div>
            </div>

            <!-- Sliding Switch -->
            <button
              type="button"
              @click="toggleLayer('divergence')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="modelValue.divergence ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                :class="modelValue.divergence ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Status & Actions -->
      <div class="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium px-0.5">
        <span class="flex items-center gap-1.5">
          <span class="font-mono">Live Sync Active</span>
        </span>
        <button
          type="button"
          @click="toggleAll(activeLayerCount === 0)"
          class="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-bold cursor-pointer transition-colors"
        >
          {{ activeLayerCount === 0 ? 'Show All' : 'Hide All' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
  windDirection: { type: String, default: 'SW' }
});

const emit = defineEmits(['update:modelValue']);

const isExpanded = ref(false);

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

const currentPreset = computed(() => {
  const { official, community, anomalies, hotspots, wind, divergence } = props.modelValue;
  if (official && community && anomalies && hotspots && wind && divergence) return 'all';
  if (official && !community && !anomalies && !hotspots && !wind) return 'official';
  if (!official && community && !anomalies) return 'community';
  if (!official && !community && anomalies) return 'anomalies';
  return 'custom';
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
    case 'anomalies':
      emit('update:modelValue', { official: false, community: false, anomalies: true, hotspots: true, wind: true, divergence: true });
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
</script>