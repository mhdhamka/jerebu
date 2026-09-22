<template>
  <div class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50/40 dark:from-slate-900 dark:to-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-tight">Ground Truth Reality Check (Divergence Engine)</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">Sensor vs. Crowd</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Identifies official telemetry lag, river basin inversion, or localized peat smoke plumes</p>
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

      <!-- Overview Stats -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <span class="font-bold text-slate-700 dark:text-slate-200">{{ alerts.length }} Active Sensor Divergence Clusters Detected</span>
        </div>
        <span class="text-slate-400 text-[11px]">Radius: 25 km buffer</span>
      </div>

      <!-- Divergences List -->
      <div class="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
        <div v-if="alerts.length === 0" class="py-12 text-center text-slate-400">
          <svg class="w-10 h-10 mx-auto text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-xs font-bold text-slate-700 dark:text-slate-300">No Significant Sensor Divergence</div>
          <p class="text-[11px] text-slate-500 mt-1">Official government stations are closely aligned with ground resident observations.</p>
        </div>

        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="p-4 rounded-2xl border transition-all"
          :class="alert.severity === 'CRITICAL' 
            ? 'border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20' 
            : 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20'"
        >
          <!-- Station & Delta Header -->
          <div class="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black uppercase text-slate-800 dark:text-slate-100">{{ alert.stationName }} ({{ alert.city }})</span>
                <span
                  class="text-[9px] px-2 py-0.5 rounded font-black tracking-wide"
                  :class="alert.severity === 'CRITICAL' ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100' : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'"
                >
                  {{ alert.direction }} DELTA: +{{ alert.delta }} AQI
                </span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{{ alert.summary }}</p>
            </div>

            <!-- Comparison Box -->
            <div class="flex items-center gap-2 shrink-0 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-center font-mono">
              <div>
                <span class="text-[8px] uppercase text-slate-400 block font-bold">Official</span>
                <span class="text-sm font-extrabold text-slate-700 dark:text-slate-200">{{ alert.officialAqi }}</span>
              </div>
              <span class="text-slate-300 text-xs">vs</span>
              <div>
                <span class="text-[8px] uppercase text-orange-500 block font-bold">Crowd</span>
                <span class="text-sm font-extrabold text-orange-600">{{ alert.avgCitizenAqi }}</span>
              </div>
            </div>
          </div>

          <!-- Ground Factors & Probable Causes -->
          <div class="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-700 dark:text-slate-300">Ground Evidence:</span>
              <span>{{ alert.nearbyCount }} local citizen reports ({{ alert.lowVisCount }} reporting visibility &lt;1km, {{ alert.odorCount }} reporting strong smoke smell)</span>
            </div>

            <div>
              <span class="font-bold text-slate-700 dark:text-slate-300">Probable Causes:</span>
              <ul class="list-disc list-inside mt-0.5 space-y-0.5 pl-1 text-[10px]">
                <li v-for="(cause, i) in alert.probableCauses" :key="i">{{ cause }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close Reality Check
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { divergenceEngine } from '../services/divergenceService.js';

const props = defineProps({
  stations: { type: Array, required: true },
  reports: { type: Array, required: true }
});

defineEmits(['close']);

const alerts = computed(() => {
  return divergenceEngine.detectDivergences(props.stations, props.reports, 25);
});
</script>
