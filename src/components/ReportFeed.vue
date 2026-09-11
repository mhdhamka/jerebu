<template>
  <aside
    class="h-full w-full sm:w-88 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 text-slate-800 dark:text-slate-100 select-none transition-all duration-300 relative z-20 shadow-xl lg:shadow-none"
  >
    <!-- Expanded Content View -->
    <div class="h-full w-full flex flex-col overflow-hidden">
      <!-- Feed Header -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div class="flex items-center gap-2.5">
          <div>
            <h2 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Live Community Feed</h2>
            <div class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ filteredReports.length }} Ground Truth Reports</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <!-- Close / Hide Button -->
          <button
            v-if="showCloseButton"
            @click="$emit('close')"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Feed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search Input -->
      <div class="p-3 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Filter by neighborhood, symptom..."
            class="w-full px-3 py-1.5 pl-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
          />
          <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- Reports Scroll List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div
          v-for="rep in filteredReports"
          :key="rep.id"
          :class="[
            'p-3.5 rounded-2xl border transition-all space-y-2 shadow-xs',
            rep.estimatedAqi >= 150
              ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/80'
              : 'bg-white dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          ]"
        >
          <!-- Header -->
          <div class="flex justify-between items-start">
            <div>
              <div :class="['text-xs font-bold', rep.estimatedAqi >= 150 ? 'text-orange-950 dark:text-orange-200' : 'text-slate-800 dark:text-slate-100']">
                {{ rep.areaName }}
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                by <span class="font-medium text-slate-700 dark:text-slate-300">{{ rep.reporterName }}</span>
                <span class="text-[10px] text-slate-400 ml-1">({{ rep.trustScore }}x weight)</span>
              </div>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'text-xs font-mono font-extrabold px-2 py-0.5 rounded-full',
                  rep.estimatedAqi >= 150 ? 'bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                ]"
              >
                {{ rep.estimatedAqi }} AQI
              </span>
              <div class="text-[10px] text-slate-400 mt-0.5">{{ rep.timestamp }}</div>
            </div>
          </div>

          <!-- Description -->
          <p :class="['text-xs leading-snug italic', rep.estimatedAqi >= 150 ? 'text-orange-900 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300']">
            "{{ rep.description }}"
          </p>

          <!-- Indicators & Symptoms Tags -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span
              v-if="rep.intensityLabel"
              class="text-[10px] font-bold px-2 py-0.5 bg-orange-100 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-800 rounded-full"
            >
              {{ rep.intensityLabel }}
            </span>
            <span
              v-if="rep.smellLevel && rep.smellLevel !== 'None'"
              class="text-[10px] font-medium px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 rounded-full"
            >
              {{ rep.smellLevel }} Odor
            </span>
            <span
              class="text-[10px] font-medium px-2 py-0.5 bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full"
            >
              Vis: {{ rep.visibilityLabel }}
            </span>
            <span
              v-for="sym in (rep.symptoms || [])"
              :key="sym"
              class="text-[10px] font-medium px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 rounded-full"
            >
              {{ sym }}
            </span>
          </div>

          <!-- Card Footer -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div class="flex items-center gap-1.5">
              <button
                @click="$emit('upvote', rep.id)"
                class="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <span>Helpful ({{ rep.upvotes }})</span>
              </button>
              <button
                @click="$emit('share', rep)"
                class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-[11px] font-semibold transition-colors cursor-pointer border border-orange-200 dark:border-orange-800/60"
                title="Share air quality status card"
              >
                <svg class="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                <span>Share</span>
              </button>
            </div>
            <span class="text-[10px] font-mono text-slate-400 dark:text-slate-400">
              Panic: <strong :class="rep.panicScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'">{{ rep.panicScore }}%</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Sleek Aside Footer -->
      <div class="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
        <p class="font-medium text-slate-500 dark:text-slate-400">Powered by Jerebu</p>
        <p class="text-slate-400 dark:text-slate-500 mt-0.5">Real-time air quality & hazard tracking</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  reports: { type: Array, default: () => [] },
  showCloseButton: { type: Boolean, default: false }
});

defineEmits(['close', 'upvote', 'share']);

const searchQuery = ref('');

const filteredReports = computed(() => {
  if (!searchQuery.value.trim()) return props.reports;
  const q = searchQuery.value.toLowerCase();
  return props.reports.filter(r =>
    r.areaName.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q) ||
    r.reporterName.toLowerCase().includes(q) ||
    (r.symptoms && r.symptoms.some(s => s.toLowerCase().includes(q)))
  );
});
</script>