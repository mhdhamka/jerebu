<template>
  <aside class="h-full w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 text-slate-800 dark:text-slate-100 overflow-y-auto select-none transition-colors duration-200">
    
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
      <div class="flex items-center gap-2">
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Anomaly Intelligence</h2>
      </div>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        title="Close Panel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div class="p-5 space-y-6">

      <!-- Collapsible Quick Guide -->
      <div class="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-2xl overflow-hidden transition-all">
        <button
          @click="isGuideOpen = !isGuideOpen"
          class="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider cursor-pointer hover:bg-orange-100/40 dark:hover:bg-orange-900/25 transition-colors"
        >
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Quick Guide</span>
          </div>
          <svg
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': isGuideOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        <div v-show="isGuideOpen" class="px-3.5 pb-3.5 pt-0 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 border-t border-orange-100/60 dark:border-orange-900/30">
          <p class="pt-2">
            This panel reveals localized haze spikes by comparing official air quality stations with crowdsourced citizen reports using spatial clustering (DBSCAN) and sentiment analysis.
          </p>
        </div>
      </div>
      
      <!-- Primary Active Anomaly Cards -->
      <div v-if="activeAnomalies.length > 0" class="space-y-3">
        <div
          v-for="cluster in activeAnomalies"
          :key="cluster.id"
          class="group bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/30 dark:to-slate-900/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 shadow-xs transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{{ cluster.title || 'Cluster Sector' }}</span>
            <span class="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider shadow-xs">ACTIVE</span>
          </div>
          <div class="text-3xl font-black text-blue-950 dark:text-blue-100 mb-1 font-mono tracking-tight">
            +{{ cluster.discrepancy }} AQI
          </div>
          <p class="text-xs text-blue-800/80 dark:text-blue-300 leading-snug">
            {{ cluster.count }} citizen reports indicate a localized smoke spike (Avg AQI {{ cluster.avgAqi }}) detected via spatial analysis.
          </p>
          <div class="mt-3 pt-2.5 border-t border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-900 dark:text-blue-300 font-mono">
            <span>Density: <strong>{{ cluster.density }} pts</strong></span>
            <span>Radius: <strong>{{ cluster.radiusKm }} km</strong></span>
          </div>
        </div>
      </div>

      <div v-else class="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        No active localized spikes detected under current threshold settings.
      </div>

      <!-- Official vs Crowdsource Comparison Bars (Dynamic) -->
      <div class="space-y-3">
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Official vs Ground Truth</h2>
        <div class="bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 space-y-4">
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Gov Data (Regional Average)</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 font-mono">{{ comparisonData.govAqi }}</span>
            </div>
            <div class="w-full h-2 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full transition-all duration-500" :style="{ width: comparisonData.govPercentage + '%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Ground Truth (Citizen Reports)</span>
              <span class="font-bold text-orange-600 dark:text-orange-400 font-mono">{{ comparisonData.citizenAqi }}</span>
            </div>
            <div class="w-full h-2 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div class="h-full bg-orange-600 rounded-full transition-all duration-500" :style="{ width: comparisonData.citizenPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panic Index Gauge (Dynamic) -->
      <div class="pt-2">
        <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 text-center">Community Panic Index</h2>
        <div class="relative w-36 h-20 mx-auto overflow-hidden">
          <!-- Gauge track -->
          <div class="absolute inset-0 border-[14px] border-slate-100 dark:border-slate-800 border-b-0 rounded-t-full"></div>
          <!-- Gauge fill -->
          <div
            class="absolute inset-0 border-[14px] border-orange-500 border-b-0 rounded-t-full origin-bottom transition-all duration-700"
            :style="{ transform: `rotate(${panicRotation}deg)` }"
          ></div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
            <span class="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-tight">{{ panicLabel }}</span>
            <span class="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-semibold">{{ panicPercentage }}%</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 px-2 italic leading-relaxed">
          AI sentiment analysis detected high-urgency keywords in {{ panicPercentage }}% of recent local reports.
        </p>
      </div>

      <!-- Interactive Parameter Tuning -->
      <div class="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Detection Settings</h2>
          <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Custom Tuner</span>
        </div>

        <div class="space-y-4 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4">
          <!-- Epsilon Radius -->
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-slate-600 dark:text-slate-400 font-medium">Cluster Radius</span>
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
            <div class="flex justify-between text-xs mb-1.5">
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
        </div>

        <!-- Recalculate Button -->
        <button
          @click="applyRecalculation"
          class="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          <svg class="w-4 h-4 text-orange-400 dark:text-white transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Recalculate Clusters</span>
        </button>
      </div>

    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  anomalies: { type: Array, default: () => [] },
  comparisonData: { 
    type: Object, 
    default: () => ({ govAqi: 124, govPercentage: 60, citizenAqi: 168, citizenPercentage: 84 }) 
  },
  panicPercentage: { type: Number, default: 78 }
});

const emit = defineEmits(['close', 'recalculate-dbscan']);

const isGuideOpen = ref(false);
const epsKm = ref(8);
const minSamples = ref(2);

// Automatically derive the text label based on the panic percentage prop
const panicLabel = computed(() => {
  if (props.panicPercentage > 70) return 'High';
  if (props.panicPercentage > 40) return 'Moderate';
  return 'Low';
});

const panicRotation = computed(() => {
  return -90 + (props.panicPercentage / 100) * 180;
});

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