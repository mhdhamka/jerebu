<template>
  <aside class="h-full w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 text-slate-800 dark:text-slate-100 overflow-y-auto select-none transition-colors duration-200">
    
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Anomaly Detection</h2>
      </div>
      <button
        @click="$emit('close')"
        class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div class="p-5 space-y-6">
      
      <!-- Primary Active Anomaly Cards -->
      <div v-if="activeAnomalies.length > 0" class="space-y-3">
        <div
          v-for="cluster in activeAnomalies"
          :key="cluster.id"
          class="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-4 shadow-xs"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{{ cluster.title || 'Cluster Sector' }}</span>
            <span class="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">ACTIVE</span>
          </div>
          <div class="text-3xl font-black text-blue-900 dark:text-blue-200 mb-1 font-mono tracking-tight">
            +{{ cluster.discrepancy }} AQI
          </div>
          <p class="text-xs text-blue-700 dark:text-blue-300 leading-snug">
            {{ cluster.count }} citizen reports indicate a localized smoke spike (Avg AQI {{ cluster.avgAqi }}) detected via DBSCAN.
          </p>
          <div class="mt-3 pt-2.5 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-[11px] text-blue-800 dark:text-blue-300 font-mono">
            <span>Cluster Density: <strong>{{ cluster.density }} pts</strong></span>
            <span>Radius: <strong>{{ cluster.radiusKm }} km</strong></span>
          </div>
        </div>
      </div>

      <div v-else class="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        No active localized spikes detected under current DBSCAN threshold.
      </div>

      <!-- Official vs Crowdsource Comparison Bars -->
      <div>
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4">Official vs Crowdsource</h2>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Gov Data (API Regional Avg)</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 font-mono">124</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-orange-400 rounded-full transition-all duration-500" style="width: 60%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Ground Truth (Citizen Reports)</span>
              <span class="font-bold text-orange-600 dark:text-orange-400 font-mono">168</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-orange-600 rounded-full transition-all duration-500" style="width: 84%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panic Index Gauge -->
      <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 text-center">Panic Index</h2>
        <div class="relative w-36 h-20 mx-auto">
          <!-- Gauge track -->
          <div class="absolute inset-0 border-[14px] border-slate-100 dark:border-slate-800 border-b-0 rounded-t-full"></div>
          <!-- Gauge fill -->
          <div
            class="absolute inset-0 border-[14px] border-orange-500 border-b-0 rounded-t-full origin-bottom"
            style="transform: rotate(115deg);"
          ></div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
            <span class="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-tight">High</span>
            <span class="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-semibold">78%</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 px-2 italic leading-relaxed">
          FastAPI NLP detected 'Alarm' and 'Pedih Mata' keywords in 78% of local citizen descriptions.
        </p>
      </div>

      <!-- DBSCAN Interactive Parameter Tuning -->
      <div class="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">DBSCAN Hyperparameters</h2>
          <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">FastAPI</span>
        </div>

        <!-- Epsilon Radius -->
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Cluster Radius (eps_km)</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ epsKm }} km</span>
          </div>
          <input
            type="range"
            v-model.number="epsKm"
            min="2"
            max="25"
            step="1"
            class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <!-- Min Samples -->
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Min Sample Points</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ minSamples }} reports</span>
          </div>
          <input
            type="range"
            v-model.number="minSamples"
            min="2"
            max="6"
            step="1"
            class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <!-- Recalculate Button -->
        <button
          @click="applyRecalculation"
          class="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5 text-orange-400 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Recalculate DBSCAN Clusters</span>
        </button>
      </div>

    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  anomalies: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'recalculate-dbscan']);

const epsKm = ref(8);
const minSamples = ref(2);

const activeAnomalies = computed(() => {
  return props.anomalies.filter(a => a.isAnomaly);
});

function applyRecalculation() {
  emit('recalculate-dbscan', {
    epsKm: epsKm.value,
    minSamples: minSamples.value
  });
}
</script>