<template>
  <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-30 select-none transition-colors duration-200 relative">
    
    <!-- Logo & Title -->
    <div class="flex items-center gap-3">
      <!-- Modernized Haze Icon Container -->
      <div class="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 ring-2 ring-orange-500/20">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 014 0h.5a2 2 0 002-2V7.5M12 21a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      </div>
      <div class="flex items-center">
        <h1 class="text-base sm:text-xl font-black tracking-tight text-slate-800 dark:text-white">
          JEREBU<span class="text-orange-500">AQI</span>
        </h1>
        <span class="ml-2.5 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider hidden xs:inline-block border border-slate-200 dark:border-slate-700">
          Regional Beta
        </span>
      </div>
    </div>

    <!-- Right Controls: Master Hub Dropdown Toggle -->
    <div class="relative flex items-center gap-2">
      
      <!-- MOE School Action Pill -->
      <button
        type="button"
        @click="$emit('open-moe-modal')"
        class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
        :class="maxAqi > 200 ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300' : maxAqi > 100 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'"
        title="View Ministry of Education (MOE) Malaysia Haze SOP"
      >
        <span class="text-sm">🏫</span>
        <span>MOE: <strong class="font-extrabold">{{ moeStatusText }}</strong></span>
      </button>

      <!-- Live Feed Sync Trigger Button -->
      <button
        type="button"
        @click="$emit('open-sync-modal')"
        class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Sync Live AQI from IQAir / DOE Malaysia"
      >
        <span class="hidden sm:inline font-bold">Live Sync</span>
        <span class="text-[10px] px-1.5 py-0.2 bg-emerald-200/70 dark:bg-emerald-800/80 rounded font-mono font-black text-emerald-900 dark:text-emerald-200">IQAir</span>
      </button>

      <!-- Quick Regional Pill Preview (Styled like the map marker card) -->
      <div class="hidden md:flex flex-col items-center justify-center px-3.5 py-1 bg-orange-500 text-white rounded-xl shadow-sm border border-orange-400 text-center leading-tight">
        <span class="text-[9px] uppercase tracking-wider font-bold opacity-90">Regional Avg</span>
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-black tracking-tight">142</span>
          <span class="text-[10px] font-semibold opacity-95">Unhealthy</span>
        </div>
      </div>

      <!-- Master Control Hub Button -->
      <button
        @click="isMenuOpen = !isMenuOpen"
        class="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs"
        :class="isMenuOpen 
          ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'"
        aria-label="Toggle Control Hub"
      >
        <svg class="w-4 h-4 text-orange-500" :class="isMenuOpen ? 'text-white' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>
        <span>Control Hub</span>
        <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="isMenuOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      <!-- Dropdown Control Hub Panel -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div 
          v-if="isMenuOpen" 
          class="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 sm:p-5 z-50 flex flex-col gap-3.5 text-slate-700 dark:text-slate-200"
        >
          <!-- Section 1: Regional Metrics Overview -->
          <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 uppercase font-bold tracking-wider text-[10px]">Regional Metrics</span>
              <span class="font-bold text-orange-600 dark:text-orange-400 text-xs">142 Unhealthy</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <div class="text-xs font-black text-emerald-600 dark:text-emerald-400">{{ officialCount }}</div>
                <div class="text-[10px] text-slate-400 font-medium">Official</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <div class="text-xs font-black text-orange-500">{{ reportCount }}</div>
                <div class="text-[10px] text-slate-400 font-medium">Reports</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <div class="text-xs font-black text-blue-500">{{ anomalyCount }}</div>
                <div class="text-[10px] text-slate-400 font-medium">Spikes</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Core Intelligence Features -->
          <div class="space-y-1.5">
            <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Haze Intelligence & Action</div>
            
            <div class="grid grid-cols-2 gap-2">
              <!-- 24h & 7d Forecast Button -->
              <button
                type="button"
                @click="$emit('open-forecast-modal'); isMenuOpen = false;"
                class="p-2.5 rounded-xl border border-orange-200/80 dark:border-orange-800/80 bg-orange-50/50 dark:bg-orange-950/30 text-left hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all cursor-pointer"
              >
                <div class="text-xs font-bold text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                  <span>AQI Forecast</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">24h & 7d Dispersion</div>
              </button>

              <!-- MOE School SOP Button -->
              <button
                type="button"
                @click="$emit('open-moe-modal'); isMenuOpen = false;"
                class="p-2.5 rounded-xl border border-red-200/80 dark:border-red-800/80 bg-red-50/50 dark:bg-red-950/30 text-left hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer"
              >
                <div class="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                  <span>MOE SOP</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">School Guidelines</div>
              </button>

              <!-- Divergence Reality Check Button -->
              <button
                type="button"
                @click="$emit('open-divergence-modal'); isMenuOpen = false;"
                class="p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 text-left hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all cursor-pointer"
              >
                <div class="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>Reality Check</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sensor vs. Ground</div>
              </button>

              <!-- Alerts & PWA Settings Button -->
              <button
                type="button"
                @click="$emit('open-notification-modal'); isMenuOpen = false;"
                class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left hover:border-orange-400 transition-all cursor-pointer"
              >
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>PWA & Alerts</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Push & Install</div>
              </button>
            </div>
          </div>

          <!-- Section 3: Persona & Preferences -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Persona</label>
            <select
              :value="activeUser.id"
              @change="onUserChange($event.target.value)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option v-for="user in trustedUsers" :key="user.id" :value="user.id">
                {{ user.name }} (Trust Weight: {{ user.trustWeight }}x)
              </option>
            </select>
          </div>

          <!-- Section 4: Utilities Grid -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Theme Toggle -->
            <button
              type="button"
              @click="$emit('toggle-theme')"
              class="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400"
            >
              <svg v-if="isDark" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
              <svg v-else class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
              </svg>
              <span>{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
            </button>

            <!-- Export CSV Button -->
            <button
              type="button"
              @click="$emit('open-export-modal'); isMenuOpen = false;"
              class="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400"
            >
              <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export CSV</span>
            </button>

            <!-- DBSCAN Toggle Button -->
            <button
              @click="$emit('toggle-dbscan')"
              :class="[
                'px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer col-span-2',
                isDbscanOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              ]"
            >
              <span class="w-2 h-2 rounded-full" :class="isDbscanOpen ? 'bg-white' : 'bg-blue-500'"></span>
              <span>DBSCAN Spikes Panel</span>
            </button>
          </div>

          <!-- Section 5: Primary Action CTA -->
          <button
            @click="$emit('open-report-modal'); isMenuOpen = false;"
            class="w-full bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <svg class="w-4 h-4 text-orange-400 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Submit Ground Haze Report</span>
          </button>
        </div>
      </transition>

    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { TRUSTED_USERS } from '../data/initialReports.js';
import { getMoeAdvisory } from '../services/moeAdvisoryService.js';

const props = defineProps({
  officialCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  anomalyCount: { type: Number, default: 0 },
  activeUser: { type: Object, required: true },
  isDbscanOpen: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
  maxAqi: { type: Number, default: 142 }
});

const emit = defineEmits([
  'toggle-dbscan',
  'open-report-modal',
  'open-export-modal',
  'open-sync-modal',
  'open-forecast-modal',
  'open-moe-modal',
  'open-divergence-modal',
  'open-notification-modal',
  'switch-user',
  'toggle-theme'
]);

const isMenuOpen = ref(false);
const trustedUsers = TRUSTED_USERS;

const moeStatusText = computed(() => {
  const advisory = getMoeAdvisory(props.maxAqi);
  return advisory.schoolBadge;
});

function onUserChange(userId) {
  const found = trustedUsers.find(u => u.id === userId);
  if (found) {
    emit('switch-user', found);
  }
}
</script>