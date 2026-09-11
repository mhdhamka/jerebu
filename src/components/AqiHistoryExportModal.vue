<template>
  <div
    class="fixed inset-0 z-[550] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Download Local AQI History</span>
              <span class="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono text-[10px] font-bold border border-orange-200 dark:border-orange-800">
                .CSV
              </span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Export high-resolution air quality time-series and PM2.5 trends for your specific neighborhood or division.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close (Esc)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-5 overflow-y-auto space-y-5 text-xs">
        <!-- 1. Selection Controls: Specific Area & Time Range -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-750">
          <!-- Area Selector -->
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              1. Select Specific Area / Station
            </label>
            <div class="relative">
              <select
                v-model="selectedAreaId"
                class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
              >
                <option v-for="area in availableAreas" :key="area.id" :value="area.id">
                  {{ area.name }} ({{ area.division }})
                </option>
              </select>
            </div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {{ currentProfile?.description }}
            </p>
          </div>

          <!-- Time Range Selector -->
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              2. Historical Time Range
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="range in timeRanges"
                :key="range.id"
                type="button"
                @click="selectedTimeRange = range.id"
                :class="[
                  'py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer',
                  selectedTimeRange === range.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                ]"
              >
                {{ range.label }}
              </button>
            </div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {{ activeRangeDescription }}
            </p>
          </div>
        </div>

        <!-- 2. Statistical Trend Summary for Selected Area -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              Long-Term Air Quality Summary • {{ currentProfile?.name }}
            </span>
            <span class="text-[10px] font-mono text-slate-400">
              {{ historyRecords.length }} Data Points
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- Average AQI -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div class="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Average AQI</div>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-2xl font-black font-mono" :style="{ color: avgColor.bg }">{{ summary.avgAqi }}</span>
                <span class="text-[10px] font-bold" :style="{ color: avgColor.bg }">{{ avgColor.label }}</span>
              </div>
            </div>

            <!-- Peak AQI -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div class="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Peak AQI Surge</div>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-2xl font-black font-mono" :style="{ color: maxColor.bg }">{{ summary.maxAqi }}</span>
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {{ summary.peakRecord?.date }}
                </span>
              </div>
            </div>

            <!-- Unhealthy Days / Readings -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div class="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Unhealthy (>100 AQI)</div>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{{ summary.unhealthyCount }}</span>
                <span class="text-[10px] font-semibold text-slate-400">({{ summary.unhealthyPct }}% of timeframe)</span>
              </div>
            </div>

            <!-- Trend Trajectory -->
            <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div class="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Trend Direction</div>
              <div class="flex items-center gap-1.5 mt-1">
                <span v-if="summary.trend === 'improving'" class="text-emerald-500 font-black text-sm flex items-center gap-1">
                  ↓ Improving
                </span>
                <span v-else-if="summary.trend === 'worsening'" class="text-rose-500 font-black text-sm flex items-center gap-1">
                  ↑ Haze Rising
                </span>
                <span v-else class="text-amber-500 font-black text-sm flex items-center gap-1">
                  → Fluctuating
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Trend Visualizer Sparkbar -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">AQI Chronological Trajectory</span>
            <span class="text-[10px] font-mono text-slate-400">Chronological Timeline (Oldest → Recent)</span>
          </div>
          <div class="h-14 flex items-end gap-1 overflow-x-auto pb-1 pt-2">
            <div
              v-for="(rec, idx) in historyRecords"
              :key="idx"
              class="flex-1 min-w-[5px] max-w-[14px] rounded-t transition-all hover:opacity-80 relative group cursor-pointer"
              :style="{
                height: `${Math.max(12, Math.min(100, (rec.aqi / 300) * 100))}%`,
                backgroundColor: getBarColor(rec.aqi)
              }"
            >
              <!-- Tooltip on hover -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none font-mono">
                <div>{{ rec.date }} {{ rec.time }}</div>
                <div class="font-bold text-orange-400">{{ rec.aqi }} AQI ({{ rec.pm25UgM3 }} µg/m³)</div>
              </div>
            </div>
          </div>
          <div class="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
            <span>{{ historyRecords[0]?.date }}</span>
            <span>{{ historyRecords[Math.floor(historyRecords.length / 2)]?.date }}</span>
            <span>{{ historyRecords[historyRecords.length - 1]?.date }}</span>
          </div>
        </div>

        <!-- 4. Real-time Live CSV Table Preview -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              CSV Dataset Preview (Showing first 6 of {{ historyRecords.length }} rows)
            </span>
            <span class="text-[10px] font-mono text-slate-400">RFC 4180 Format • UTF-8 with BOM</span>
          </div>

          <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto shadow-xs">
            <table class="w-full text-left text-[11px] divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th class="px-3 py-2 font-mono">Date/Time</th>
                  <th class="px-3 py-2">Area</th>
                  <th class="px-3 py-2 font-mono">AQI</th>
                  <th class="px-3 py-2">Status</th>
                  <th class="px-3 py-2 font-mono">PM2.5</th>
                  <th class="px-3 py-2">Smell / Visibility</th>
                  <th class="px-3 py-2">Wind</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                <tr v-for="row in previewRows" :key="row.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-3 py-1.5 font-mono text-[10px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {{ row.date }} {{ row.time }}
                  </td>
                  <td class="px-3 py-1.5 whitespace-nowrap font-medium">{{ row.areaName.split(' ')[0] }}</td>
                  <td class="px-3 py-1.5 font-mono font-bold whitespace-nowrap" :style="{ color: getAQIColor(row.aqi).bg }">
                    {{ row.aqi }}
                  </td>
                  <td class="px-3 py-1.5 whitespace-nowrap">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" :style="{ background: getAQIColor(row.aqi).bg + '22', color: getAQIColor(row.aqi).bg }">
                      {{ row.statusCategory }}
                    </span>
                  </td>
                  <td class="px-3 py-1.5 font-mono whitespace-nowrap">{{ row.pm25UgM3 }} µg/m³</td>
                  <td class="px-3 py-1.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {{ row.visibilityMeters }}m • {{ row.smellIntensity.split(' ')[0] }}
                  </td>
                  <td class="px-3 py-1.5 font-mono whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {{ row.windDirection }} {{ row.windSpeedKmh }} km/h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. Metadata and Excel Compatibility Notice -->
        <div class="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <span class="font-bold">Excel & Pandas Ready:</span> This CSV includes a UTF-8 Byte Order Mark (BOM) and structured headers for instant import into Microsoft Excel, Google Sheets, Python Pandas (`pd.read_csv`), and R without character encoding errors.
          </div>
        </div>
      </div>

      <!-- Modal Footer with CTA Download -->
      <div class="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
          File: <span class="font-bold text-slate-700 dark:text-slate-300">{{ targetFilename }}</span>
        </div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="triggerDownload"
            :disabled="isDownloading"
            class="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 border border-orange-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <svg v-if="!isDownloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isDownloading ? 'Preparing CSV...' : `Download CSV (${historyRecords.length} records)` }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  AREA_HISTORICAL_PROFILES,
  generateAreaAqiHistory,
  calculateAqiHistorySummary,
  formatAqiHistoryToCsv,
  downloadCsvFile
} from '../services/aqiHistoryService.js';
import { getAQIColor } from '../data/officialStations.js';

const props = defineProps({
  initialAreaId: { type: String, default: 'miri' }
});

const emit = defineEmits(['close', 'downloaded']);

const selectedAreaId = ref(props.initialAreaId || 'miri');
const selectedTimeRange = ref('30d');
const isDownloading = ref(false);

const availableAreas = AREA_HISTORICAL_PROFILES;

const timeRanges = [
  { id: '24h', label: '24 Hours', desc: 'Hourly readings for the past 24 hours' },
  { id: '7d', label: '7 Days', desc: '6-hourly resolution tracking weekly smoke drift' },
  { id: '30d', label: '30 Days', desc: 'Daily peak & average trends for the past month' },
  { id: '90d', label: '90 Days', desc: 'Full July-September seasonal peat haze cycle' }
];

const currentProfile = computed(() => {
  return availableAreas.find(a => a.id === selectedAreaId.value) || availableAreas[0];
});

const activeRangeDescription = computed(() => {
  const found = timeRanges.find(r => r.id === selectedTimeRange.value);
  return found ? found.desc : '';
});

// Generated historical records based on selected area and time range
const historyRecords = computed(() => {
  return generateAreaAqiHistory(selectedAreaId.value, selectedTimeRange.value);
});

// Statistical summary
const summary = computed(() => {
  return calculateAqiHistorySummary(historyRecords.value);
});

const avgColor = computed(() => getAQIColor(summary.value.avgAqi));
const maxColor = computed(() => getAQIColor(summary.value.maxAqi));

// First 6 rows for table preview
const previewRows = computed(() => {
  return historyRecords.value.slice(0, 6);
});

const targetFilename = computed(() => {
  const clean = (currentProfile.value?.id || 'sarawak').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStamp = new Date().toISOString().split('T')[0];
  return `jerebu-aqi-${clean}-${selectedTimeRange.value}-${dateStamp}.csv`;
});

function getBarColor(aqi) {
  return getAQIColor(aqi).bg;
}

function triggerDownload() {
  isDownloading.value = true;
  setTimeout(() => {
    try {
      const csvString = formatAqiHistoryToCsv(historyRecords.value, {
        areaName: currentProfile.value.name,
        division: currentProfile.value.division,
        timeRange: selectedTimeRange.value.toUpperCase()
      });

      downloadCsvFile(csvString, targetFilename.value);

      emit('downloaded', {
        areaName: currentProfile.value.name,
        filename: targetFilename.value,
        rowCount: historyRecords.value.length
      });

      setTimeout(() => {
        isDownloading.value = false;
        emit('close');
      }, 500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      isDownloading.value = false;
    }
  }, 250);
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
</style>
