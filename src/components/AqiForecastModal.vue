<template>
  <div class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-orange-50/30 dark:from-slate-900 dark:to-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-tight">24-Hour & 7-Day Air Quality Forecast</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">ECMWF / CAMS</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Atmospheric dispersion, boundary layer inversion & transboundary smoke projection</p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close forecast"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Station Selector Bar -->
      <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500">Target Station:</span>
          <select
            v-model="selectedStationId"
            @change="loadForecast"
            class="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option v-for="st in stationList" :key="st.id" :value="st.id">
              {{ st.name }} ({{ st.city }}) — {{ st.aqi }} AQI
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 text-xs text-slate-500">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Updated Hourly</span>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        <!-- Loading State -->
        <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div class="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-medium">Computing atmospheric dispersion curve...</span>
        </div>

        <div v-else class="space-y-6">
          <!-- 24-Hour Interactive Timeline Curve -->
          <div class="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Next 24 Hours Hourly Curve</h3>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Note diurnal peak in early mornings (06:00 - 09:00 AM) due to thermal boundary inversion</p>
              </div>
              <div v-if="hoveredHour" class="text-right">
                <span class="text-[10px] text-slate-400">{{ hoveredHour.hourLabel }} ({{ hoveredHour.dateLabel }})</span>
                <div class="text-base font-black font-mono" :style="{ color: hoveredHour.category.color }">
                  {{ hoveredHour.aqi }} AQI • {{ hoveredHour.pm25 }} µg/m³
                </div>
              </div>
            </div>

            <!-- SVG Visual Curve -->
            <div class="relative w-full h-40 select-none">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 720 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f97316" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#f97316" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                <!-- AQI Category Reference Grid Lines -->
                <line x1="0" y1="95" x2="720" y2="95" stroke="#f59e0b" stroke-dasharray="3 3" stroke-width="0.8" opacity="0.4" />
                <line x1="0" y1="65" x2="720" y2="65" stroke="#f97316" stroke-dasharray="3 3" stroke-width="0.8" opacity="0.5" />
                <line x1="0" y1="35" x2="720" y2="35" stroke="#ef4444" stroke-dasharray="3 3" stroke-width="0.8" opacity="0.5" />

                <!-- Area Fill -->
                <path :d="curveAreaPath" fill="url(#curveGradient)" />
                <!-- Main Stroke Line -->
                <path :d="curveLinePath" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" />

                <!-- Data Points & Interaction Hover Targets -->
                <g v-for="(pt, idx) in curvePoints" :key="idx">
                  <circle
                    :cx="pt.x"
                    :cy="pt.y"
                    r="4"
                    :fill="pt.category.color"
                    class="transition-all hover:r-6 cursor-pointer"
                    @mouseenter="hoveredHour = pt.raw"
                  />
                  <!-- Peak Hour Marker -->
                  <text
                    v-if="pt.isPeak"
                    :x="pt.x"
                    :y="pt.y - 10"
                    text-anchor="middle"
                    class="text-[9px] font-black fill-red-500 font-mono"
                  >
                    PEAK {{ pt.raw.aqi }}
                  </text>
                </g>
              </svg>

              <!-- X-Axis Labels (Every 3 hours) -->
              <div class="flex justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span v-for="(h, idx) in forecastData?.next24Hours?.filter((_, i) => i % 3 === 0)" :key="idx">
                  {{ h.hourLabel.replace(':00 ', '') }}
                </span>
              </div>
            </div>
          </div>

          <!-- 7-Day Day-by-Day Forecast Cards -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">7-Day Outlook & Diurnal Trends</h3>
              <span class="text-[11px] text-slate-500">Based on Regional Atmospheric Dispersion</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              <div
                v-for="day in forecastData?.full7Days"
                :key="day.date"
                class="p-3 rounded-2xl border text-center transition-all hover:scale-[1.02] cursor-pointer"
                :class="[
                  day.category.bg,
                  'border-slate-200/80 dark:border-slate-700/60'
                ]"
              >
                <div class="text-[11px] font-bold text-slate-700 dark:text-slate-200">{{ day.dayName }}</div>
                <div class="text-[9px] text-slate-400 mb-2">{{ day.date.split(',')[1] || day.date }}</div>
                
                <div class="text-xl font-black font-mono" :style="{ color: day.category.color }">
                  {{ day.maxAqi }}
                </div>
                <div class="text-[10px] font-semibold" :style="{ color: day.category.color }">
                  {{ day.category.label }}
                </div>

                <div class="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[9px] text-slate-500">
                  <span>Range: {{ day.minAqi }}–{{ day.maxAqi }}</span>
                  <div class="text-[8px] opacity-80 mt-0.5">Peak ~{{ day.peakHour }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Scientific Context & Health Impact -->
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="leading-relaxed">
              <span class="font-bold">Inversion Trapping Advisory:</span> In Sarawak river basins (Kuching, Samarahan, Sri Aman), night-time radiational cooling creates a temperature inversion trap, trapping smoke near ground level between 05:30 AM and 09:30 AM. Outdoor morning runs and school assemblies should be scheduled for late afternoon when convective heating dilutes surface smoke.
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
          Close Forecast
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { aqiForecast } from '../services/aqiForecastService.js';
import { OFFICIAL_STATIONS } from '../data/officialStations.js';

const props = defineProps({
  stations: { type: Array, default: () => [] },
  initialStationId: { type: String, default: 'MY_SWK_02' }
});

defineEmits(['close']);

const selectedStationId = ref(props.initialStationId || 'MY_SWK_02');
const forecastData = ref(null);
const isLoading = ref(true);
const hoveredHour = ref(null);

const stationList = computed(() => {
  return (props.stations && props.stations.length > 0) ? props.stations : OFFICIAL_STATIONS;
});

const currentStation = computed(() => {
  const list = stationList.value;
  return list.find(s => s.id === selectedStationId.value) || list[0] || {};
});

async function loadForecast() {
  isLoading.value = true;
  const st = currentStation.value;
  try {
    const data = await aqiForecast.getForecast(st?.lat || 1.5533, st?.lng || 110.3592, st?.name || 'Kuching');
    forecastData.value = data;
    if (data.next24Hours && data.next24Hours.length > 0) {
      hoveredHour.value = data.next24Hours[0];
    }
  } catch (err) {
    console.error('Forecast load error:', err);
  } finally {
    isLoading.value = false;
  }
}

// Compute SVG coordinate points
const curvePoints = computed(() => {
  const hours = forecastData.value?.next24Hours || [];
  if (hours.length === 0) return [];

  const maxVal = Math.max(200, ...hours.map(h => h.aqi));
  const minVal = 0;
  const width = 720;
  const height = 120;
  const paddingY = 15;

  const maxAqi = Math.max(...hours.map(h => h.aqi));

  return hours.map((h, i) => {
    const x = (i / (hours.length - 1)) * width;
    const norm = (h.aqi - minVal) / (maxVal - minVal);
    const y = height - (norm * (height - paddingY * 2)) - paddingY;
    return {
      x,
      y,
      raw: h,
      category: h.category,
      isPeak: h.aqi === maxAqi
    };
  });
});

const curveLinePath = computed(() => {
  const pts = curvePoints.value;
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) / 2;
    const cpy2 = curr.y;
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }
  return d;
});

const curveAreaPath = computed(() => {
  const line = curveLinePath.value;
  if (!line) return '';
  const pts = curvePoints.value;
  const lastX = pts[pts.length - 1].x;
  return `${line} L ${lastX} 140 L 0 140 Z`;
});

onMounted(() => {
  loadForecast();
});
</script>
