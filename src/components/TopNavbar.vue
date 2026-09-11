<template>
  <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-sm z-20 select-none transition-colors duration-200">
    
    <!-- Logo & Title -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
        </svg>
      </div>
      <div class="flex items-center">
        <h1 class="text-base sm:text-xl font-black tracking-tight text-slate-800 dark:text-white">
          JEREBU<span class="text-orange-500">WATCH</span>
        </h1>
        <span class="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider hidden xs:inline-block border border-slate-200 dark:border-slate-700">
          Regional Beta
        </span>
      </div>
    </div>

    <!-- Center Metrics & Stack Badges -->
    <div class="hidden lg:flex items-center gap-6">
      <div class="text-right">
        <div class="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-semibold tracking-wider">Regional Average</div>
        <div class="text-base font-bold text-slate-700 dark:text-slate-100 leading-tight">
          142 <span class="text-xs font-medium text-orange-600 dark:text-orange-400">Unhealthy</span>
        </div>
      </div>

      <div class="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

      <div class="flex items-center gap-2 text-xs">
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/50 dark:border-slate-700">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{{ officialCount }} Official Stations</span>
        </div>

        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 font-medium">
          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>{{ reportCount }} Citizen Reports</span>
        </div>

        <div
          v-if="anomalyCount > 0"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 font-semibold"
        >
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{{ anomalyCount }} DBSCAN Spikes</span>
        </div>
      </div>
    </div>

    <!-- Right Controls: Persona Switcher, Theme Switcher & Primary Action Buttons -->
    <div class="flex items-center gap-1.5 sm:gap-2.5">
      <!-- Active User Switcher (Laravel Auth Emulation) -->
      <div class="relative hidden sm:block">
        <select
          :value="activeUser.id"
          @change="onUserChange($event.target.value)"
          class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
        >
          <option v-for="user in trustedUsers" :key="user.id" :value="user.id">
            👤 {{ user.name }} ({{ user.trustWeight }}x)
          </option>
        </select>
      </div>

      <!-- Theme Switcher Toggle Button (Light vs High-Contrast Dark) -->
      <button
        type="button"
        id="theme-toggle-btn"
        @click="$emit('toggle-theme')"
        :class="[
          'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer select-none',
          isDark
            ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 hover:text-amber-200 shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
        ]"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode'"
        :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode'"
      >
        <span v-if="isDark" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          </svg>
          <span class="hidden sm:inline-block text-[11px] font-bold text-slate-200">Dark</span>
        </span>
        <span v-else class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
          </svg>
          <span class="hidden sm:inline-block text-[11px] font-bold text-slate-700">Light</span>
        </span>
      </button>

      <!-- Download CSV History Button -->
      <button
        type="button"
        id="btn-download-csv"
        @click="$emit('open-export-modal')"
        class="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-slate-750 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer shadow-xs"
        title="Download Local AQI History as CSV"
      >
        <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span class="hidden sm:inline">Export CSV</span>
        <span class="sm:hidden font-mono text-[10px]">CSV</span>
      </button>

      <!-- DBSCAN Toggle Button -->
      <button
        @click="$emit('toggle-dbscan')"
        :class="[
          'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer',
          isDbscanOpen
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        ]"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="isDbscanOpen ? 'bg-white' : 'bg-blue-500'"></span>
        <span class="hidden xs:inline-block">Anomalies</span>
      </button>

      <!-- Architecture Console Button -->
      <button
        @click="$emit('toggle-console')"
        :class="[
          'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer hidden md:flex',
          isConsoleOpen
            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
        <span>Stack</span>
      </button>

      <!-- Submit Ground Report CTA Button -->
      <button
        @click="$emit('open-report-modal')"
        class="bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <svg class="w-4 h-4 text-orange-400 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span class="hidden xs:inline">Submit Ground Report</span>
        <span class="xs:hidden">Report</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { TRUSTED_USERS } from '../data/initialReports.js';

const props = defineProps({
  officialCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  anomalyCount: { type: Number, default: 0 },
  activeUser: { type: Object, required: true },
  isDbscanOpen: { type: Boolean, default: false },
  isConsoleOpen: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false }
});

const emit = defineEmits([
  'toggle-dbscan',
  'toggle-console',
  'open-report-modal',
  'open-export-modal',
  'switch-user',
  'toggle-theme'
]);

const trustedUsers = TRUSTED_USERS;

function onUserChange(userId) {
  const found = trustedUsers.find(u => u.id === userId);
  if (found) {
    emit('switch-user', found);
  }
}
</script>
