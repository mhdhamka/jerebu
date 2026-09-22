<template>
  <div class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-red-50 to-orange-50/40 dark:from-slate-900 dark:to-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-tight">MOE & MOH Malaysia Haze Action Framework</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">Official SOP</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ministry of Education (KPM) & Ministry of Health (KKM) Guidelines</p>
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

      <!-- Live Sarawak Status Banner -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="px-3 py-1.5 rounded-xl font-mono font-black text-sm text-white"
            :class="maxAqi > 200 ? 'bg-purple-600 animate-pulse' : maxAqi > 150 ? 'bg-red-600' : maxAqi > 100 ? 'bg-orange-500' : 'bg-emerald-600'"
          >
            Max {{ maxAqi }} AQI
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Current Sarawak Active Level: {{ activeLevel.level }}</div>
            <div class="text-[11px] text-slate-500">{{ activeLevel.schoolAction }}</div>
          </div>
        </div>

        <span
          class="text-xs px-3 py-1 rounded-full font-bold"
          :class="activeLevel.closureTrigger ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300' : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'"
        >
          {{ activeLevel.schoolBadge }}
        </span>
      </div>

      <!-- Action Tiers List -->
      <div class="p-5 sm:p-6 space-y-3.5 max-h-[65vh] overflow-y-auto">
        <!-- Tier 1: Good -->
        <div class="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-emerald-700 dark:text-emerald-400">0 – 50 AQI / API (Good)</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-200/60 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">Normal Operations</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300">All school sessions, outdoor sports, cross-country, and assemblies continue as normal.</p>
        </div>

        <!-- Tier 2: Moderate -->
        <div class="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-amber-700 dark:text-amber-400">51 – 100 AQI / API (Moderate)</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-200/60 dark:bg-amber-800 text-amber-800 dark:text-amber-200">Health Precaution</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300">Classes continue. Students with asthma or chronic respiratory conditions should reduce prolonged vigorous exertion and keep inhalers accessible.</p>
        </div>

        <!-- Tier 3: Unhealthy for Sensitive Groups -->
        <div class="p-3.5 rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20" :class="maxAqi >= 101 && maxAqi <= 150 ? 'ring-2 ring-orange-500' : ''">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-orange-700 dark:text-orange-400">101 – 150 AQI / API (Unhealthy for Sensitive)</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-orange-200/80 dark:bg-orange-800 text-orange-900 dark:text-orange-100">🛑 CEASE OUTDOOR PE & SPORTS</span>
          </div>
          <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
            <li><strong>MOE Directive:</strong> All outdoor Physical Education (Pendidikan Jasmani), sports practice, and outdoor assemblies MUST cease immediately.</li>
            <li>Classroom activities to be held inside. Encourage hydration.</li>
          </ul>
        </div>

        <!-- Tier 4: Unhealthy -->
        <div class="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20" :class="maxAqi >= 151 && maxAqi <= 200 ? 'ring-2 ring-red-500' : ''">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-red-700 dark:text-red-400">151 – 200 AQI / API (Unhealthy)</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-red-200/80 dark:bg-red-800 text-red-900 dark:text-red-100">STRICT INDOOR CONFINEMENT</span>
          </div>
          <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
            <li>Pre-schools and primary students strictly confined to air-conditioned or filtered classrooms.</li>
            <li>Windows and doors sealed; use air purifiers where available.</li>
            <li>N95 / KN95 respirators advised for staff and students during transit.</li>
          </ul>
        </div>

        <!-- Tier 5: School Closure Trigger -->
        <div class="p-4 rounded-2xl border-2 border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 shadow-sm" :class="maxAqi > 200 ? 'ring-2 ring-purple-600 animate-pulse' : ''">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-purple-800 dark:text-purple-300">🚨 &gt; 200 AQI / API (Very Unhealthy & Hazardous)</span>
            </div>
            <span class="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-purple-600 text-white shadow-xs">SCHOOL CLOSURE TRIGGER</span>
          </div>
          <div class="text-xs text-purple-950 dark:text-purple-200 leading-relaxed font-medium space-y-1">
            <p><strong>MOE Circular Mandate:</strong> In accordance with the National Haze Disaster Management Plan, when AQI/API exceeds <strong>200</strong> at the nearest official station, all physical schools in the affected district <strong>MUST IMMEDIATELY CLOSE</strong>.</p>
            <p>Learning is immediately transitioned to Home-Based Online Learning (PdPR). Parents and school buses are notified for safe dispatch.</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <span class="text-[11px] text-slate-500">Source: Ministry of Education (MOE) Malaysia Surat Pekeliling Ikhtisas</span>
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close Advisory
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getMoeAdvisory } from '../services/moeAdvisoryService.js';

const props = defineProps({
  stations: { type: Array, default: () => [] }
});

defineEmits(['close']);

const maxAqi = computed(() => {
  if (!props.stations || props.stations.length === 0) return 142;
  const aqis = props.stations.map(s => Number(s.aqi) || 0);
  return Math.max(...aqis);
});

const activeLevel = computed(() => {
  return getMoeAdvisory(maxAqi.value);
});
</script>
