<template>
  <div
    class="z-[400] transition-all duration-200 select-none"
    :class="[
      isExpanded
        ? 'w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 transition-colors'
        : 'w-auto'
    ]"
  >
    <!-- Collapsed Floating Button State -->
    <button
      v-if="!isExpanded"
      @click="isExpanded = true"
      class="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold cursor-pointer transition-all hover:scale-105"
      title="Toggle Map Data Layers"
    >
      <div class="relative flex items-center justify-center">
        <svg class="w-4 h-4 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <span
          v-if="activeLayerCount > 0"
          class="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center font-black"
        >
          {{ activeLayerCount }}
        </span>
      </div>
      <span>Map Layers</span>
      <span class="text-[10px] text-slate-400 font-normal">({{ activeLayerCount }}/3)</span>
    </button>

    <!-- Expanded Control Panel -->
    <div v-else class="flex flex-col space-y-3">
      <!-- Panel Header -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Map Layer Controls</h3>
            <span class="text-[10px] text-slate-400 font-medium">{{ activeLayerCount }} of 3 layers visible</span>
          </div>
        </div>
        <button
          @click="isExpanded = false"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Minimize Panel"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <!-- Quick Preset View Modes -->
      <div>
        <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
          <span>Quick Preset Modes</span>
          <span class="text-[9px] text-slate-400 font-mono">1-Click Filter</span>
        </div>
        <div class="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl text-[10px] font-semibold">
          <button
            type="button"
            @click="setPreset('all')"
            :class="[
              'py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            All
          </button>
          <button
            type="button"
            @click="setPreset('official')"
            :class="[
              'py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'official'
                ? 'bg-emerald-500 text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Official
          </button>
          <button
            type="button"
            @click="setPreset('community')"
            :class="[
              'py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'community'
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Reports
          </button>
          <button
            type="button"
            @click="setPreset('anomalies')"
            :class="[
              'py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer truncate',
              currentPreset === 'anomalies'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            Anomalies
          </button>
        </div>
      </div>

      <!-- Layer 1: Official AQI Stations Toggle -->
      <div
        class="p-2.5 rounded-xl border transition-all"
        :class="[
          modelValue.official
            ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 opacity-60'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>Official AQI Data</span>
              </div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">
                APIMS, NEA & BMKG ({{ officialCount }} stations)
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
        class="p-2.5 rounded-xl border transition-all"
        :class="[
          modelValue.community
            ? 'bg-orange-50/70 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/80'
            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 opacity-60'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>User Ground Reports</span>
              </div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">
                Crowdsourced observations ({{ reportCount }} reports)
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
        class="p-2.5 rounded-xl border transition-all"
        :class="[
          modelValue.anomalies
            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80'
            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 opacity-60'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>DBSCAN Anomalies</span>
              </div>
              <div class="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                Pulsing Hazard Zones ({{ anomalyCount }} Spikes)
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

      <!-- Bottom Status & Actions -->
      <div class="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span class="flex items-center gap-1">
          <span>FastAPI & Redis Synced</span>
        </span>
        <button
          type="button"
          @click="toggleAll(activeLayerCount === 0)"
          class="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold cursor-pointer underline underline-offset-2"
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
    default: () => ({ official: true, community: true, anomalies: true })
  },
  officialCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  anomalyCount: { type: Number, default: 0 }
});

const emit = defineEmits(['update:modelValue']);

const isExpanded = ref(true);

const activeLayerCount = computed(() => {
  let count = 0;
  if (props.modelValue.official) count++;
  if (props.modelValue.community) count++;
  if (props.modelValue.anomalies) count++;
  return count;
});

const currentPreset = computed(() => {
  const { official, community, anomalies } = props.modelValue;
  if (official && community && anomalies) return 'all';
  if (official && !community && !anomalies) return 'official';
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
      emit('update:modelValue', { official: true, community: true, anomalies: true });
      break;
    case 'official':
      emit('update:modelValue', { official: true, community: false, anomalies: false });
      break;
    case 'community':
      emit('update:modelValue', { official: false, community: true, anomalies: false });
      break;
    case 'anomalies':
      emit('update:modelValue', { official: false, community: false, anomalies: true });
      break;
  }
}

function toggleAll(showAll) {
  emit('update:modelValue', {
    official: showAll,
    community: showAll,
    anomalies: showAll
  });
}
</script>
