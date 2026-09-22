<template>
  <div class="relative w-full h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
    <!-- Map Canvas Container -->
    <div id="jerebu-map" class="w-full h-full z-0 outline-none"></div>

    <!-- Floating Sarawak Geolocation Search Bar -->
    <div class="absolute top-3 sm:top-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[410] w-auto sm:w-[500px] max-w-[calc(100vw-24px)] transition-all">
      <SarawakSearchBar
        @select-location="handleLocationSelected"
        @toast="$emit('toast', $event)"
      />
    </div>

    <!-- Collapsible Hotspot Dropdown Selector (Option 1) -->
    <div class="absolute top-20 sm:top-20 left-3 sm:left-4 z-[999]" ref="dropdownContainer">
      <div class="relative">
        <button
          type="button"
          @click="isRegionDropdownOpen = !isRegionDropdownOpen"
          class="flex items-center gap-2.5 px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
        >
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Hotspot:</span>
          <span class="flex items-center gap-1.5">
            <span>{{ currentRegionObject?.flag }}</span>
            <span>{{ currentRegionObject?.name }}</span>
          </span>
          <svg 
            class="w-4 h-4 text-slate-400 transition-transform duration-200 ml-1"
            :class="{ 'rotate-180': isRegionDropdownOpen }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Dropdown Menu List -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0 -translate-y-2"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 -translate-y-2"
        >
          <div 
            v-if="isRegionDropdownOpen"
            class="absolute left-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl py-1.5 z-50 overflow-hidden"
          >
            <div class="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 mb-1">
              Select Region Focus
            </div>
            <button
              v-for="region in regions"
              :key="region.name"
              @click="selectRegion(region)"
              :class="[
                'w-full text-left text-xs px-3.5 py-2 font-semibold transition-all flex items-center justify-between cursor-pointer',
                activeRegion === region.name
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
              ]"
            >
              <span class="flex items-center gap-2">
                <span>{{ region.flag }}</span>
                <span>{{ region.name }}</span>
              </span>
              <span v-if="activeRegion === region.name" class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Map Layer Control Panel -->
    <div class="absolute top-36 sm:top-36 left-3 sm:left-4 z-[400]">
      <MapLayerControl
        v-model="filters"
        :official-count="officialStations.length"
        :report-count="reports.length"
        :anomaly-count="anomalyClusters.filter(a => a.isAnomaly).length"
        :hotspot-count="hotspots.length"
        :divergence-count="divergences.length"
        :wind-speed="windData?.speedKmh || 14.5"
        :wind-direction="windData?.directionLabel || 'SW'"
      />
    </div>

    <!-- Map Click Picker Notification Banner -->
    <div
      v-if="isPickingLocation"
      class="absolute top-4 right-4 z-[400] bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white font-medium text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80"
    >
      <span class="relative flex h-2.5 w-2.5">
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
      </span>
      <span>Click anywhere on map to pin report</span>
      <button 
        @click="$emit('cancel-pick')" 
        class="ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-semibold"
      >
        Cancel
      </button>
    </div>

    <!-- Compact Symbol Air Quality Scale Legend Button -->
    <div class="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-[400]" ref="legendContainer">
      <div class="relative">
        <button
          type="button"
          @click="isLegendOpen = !isLegendOpen"
          class="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl text-slate-700 dark:text-slate-200 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
          title="Air Quality Scale Legend"
        >
          <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </button>

        <!-- Dropdown / Popup Content -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0 translate-y-2"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 translate-y-2"
        >
          <div 
            v-if="isLegendOpen"
            class="absolute bottom-full mb-2 right-0 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-4 z-50 text-xs"
          >
            <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span>Air Quality Scale</span>
            </div>
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-sm ring-2 ring-emerald-500/20"></div>
                  <span>Good</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">0–50</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-amber-400 rounded-full shadow-sm ring-2 ring-amber-400/20"></div>
                  <span>Moderate</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">51–100</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-orange-500 rounded-full shadow-sm ring-2 ring-orange-500/20"></div>
                  <span>Unhealthy</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">101–200</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 bg-red-600 rounded-full shadow-sm ring-2 ring-red-600/20"></div>
                  <span>Hazardous</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 font-semibold">201+</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- NASA FIRMS Active Fire Satellite Overlay Control Pill / HUD -->
    <div
      v-if="filters.hotspots"
      class="absolute bottom-6 left-3 sm:left-4 z-[400] max-w-[calc(100vw-32px)] sm:max-w-md transition-all duration-300"
    >
      <!-- Collapsed Bar -->
      <div
        v-if="!isFirmsHudExpanded"
        class="flex items-center gap-2 p-1.5 pl-3 pr-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-rose-200/90 dark:border-rose-900/80 rounded-2xl shadow-2xl text-xs"
      >
        <div class="flex items-center gap-2 cursor-pointer select-none" @click="isFirmsHudExpanded = true">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span class="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span>🛰️</span>
            <span>NASA FIRMS</span>
          </span>
          <span class="font-bold text-slate-700 dark:text-slate-200">
            {{ visibleHotspotsCount }} Active Fires
          </span>
          <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            {{ totalVisibleFrp }} MW
          </span>
        </div>

        <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        <!-- Sync Button -->
        <button
          type="button"
          @click="triggerFirmsSync"
          :disabled="isFirmsSyncing"
          class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          title="Sync live NASA FIRMS feeds"
        >
          <svg
            class="w-4 h-4 text-rose-500"
            :class="{ 'animate-spin': isFirmsSyncing }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Expand button -->
        <button
          type="button"
          @click="isFirmsHudExpanded = true"
          class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          title="Expand NASA FIRMS Controls"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <!-- Expanded Control Card -->
      <div
        v-else
        class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-rose-200/90 dark:border-rose-900/80 rounded-3xl shadow-2xl text-xs space-y-3 w-80 sm:w-96"
      >
        <!-- Header with minimize -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-base">🛰️</span>
            <div>
              <div class="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                NASA FIRMS Satellite Overlay
                <span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-rose-500 text-white">LIVE</span>
              </div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">VIIRS 375m & MODIS 1km Satellites</div>
            </div>
          </div>
          <button
            type="button"
            @click="isFirmsHudExpanded = false"
            class="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div class="text-[10px] uppercase font-bold text-slate-400">Active Fires</div>
            <div class="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">{{ visibleHotspotsCount }}</div>
          </div>
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div class="text-[10px] uppercase font-bold text-slate-400">Transboundary</div>
            <div class="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{{ transboundaryCount }}</div>
          </div>
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div class="text-[10px] uppercase font-bold text-slate-400">Total FRP</div>
            <div class="text-sm font-black text-red-600 dark:text-red-400 font-mono">{{ totalVisibleFrp }} MW</div>
          </div>
        </div>

        <!-- Sensor Selection Pills -->
        <div>
          <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Satellite Sensor</div>
          <div class="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              @click="hotspotFilters.sensor = 'all'"
              :class="hotspotFilters.sensor === 'all' ? 'bg-white dark:bg-slate-700 shadow-xs text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
              class="py-1 text-[11px] rounded-lg transition-all cursor-pointer"
            >
              All Satellites
            </button>
            <button
              type="button"
              @click="hotspotFilters.sensor = 'viirs'"
              :class="hotspotFilters.sensor === 'viirs' ? 'bg-white dark:bg-slate-700 shadow-xs text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
              class="py-1 text-[11px] rounded-lg transition-all cursor-pointer"
            >
              VIIRS (375m)
            </button>
            <button
              type="button"
              @click="hotspotFilters.sensor = 'modis'"
              :class="hotspotFilters.sensor === 'modis' ? 'bg-white dark:bg-slate-700 shadow-xs text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
              class="py-1 text-[11px] rounded-lg transition-all cursor-pointer"
            >
              MODIS (1km)
            </button>
          </div>
        </div>

        <!-- Filter Options -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-700 dark:text-slate-300 font-medium">High Confidence Only (≥80%)</span>
            <button
              type="button"
              @click="hotspotFilters.confidence = hotspotFilters.confidence === 'high' ? 'all' : 'high'"
              :class="hotspotFilters.confidence === 'high' ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'"
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
            >
              <span
                :class="hotspotFilters.confidence === 'high' ? 'translate-x-3' : 'translate-x-0'"
                class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200"
              />
            </button>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-700 dark:text-slate-300 font-medium">Transboundary Origins Only</span>
            <button
              type="button"
              @click="hotspotFilters.onlyTransboundary = !hotspotFilters.onlyTransboundary"
              :class="hotspotFilters.onlyTransboundary ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'"
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
            >
              <span
                :class="hotspotFilters.onlyTransboundary ? 'translate-x-3' : 'translate-x-0'"
                class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200"
              />
            </button>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-700 dark:text-slate-300 font-medium">Projected Smoke Drift Plumes</span>
            <button
              type="button"
              @click="hotspotFilters.showPlumes = !hotspotFilters.showPlumes"
              :class="hotspotFilters.showPlumes ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'"
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
            >
              <span
                :class="hotspotFilters.showPlumes ? 'translate-x-3' : 'translate-x-0'"
                class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200"
              />
            </button>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
              <span>🌐</span> NASA Satellite Thermal Layer (WMS)
            </span>
            <button
              type="button"
              @click="toggleGibsWmsLayer"
              :class="hotspotFilters.showGibsWms ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'"
              class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
            >
              <span
                :class="hotspotFilters.showGibsWms ? 'translate-x-3' : 'translate-x-0'"
                class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200"
              />
            </button>
          </div>
        </div>

        <!-- Actions & Sync Info -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            @click="openMapKeyDialog"
            class="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium cursor-pointer"
          >
            Key: {{ apiKeyMasked }}
          </button>

          <button
            type="button"
            @click="triggerFirmsSync"
            :disabled="isFirmsSyncing"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': isFirmsSyncing }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isFirmsSyncing ? 'Syncing...' : 'Sync NASA Feed' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- NASA FIRMS Map Key Modal -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isMapKeyModalOpen"
        class="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
        @click.self="isMapKeyModalOpen = false"
      >
        <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🛰️</span>
              <div>
                <h3 class="font-bold text-base text-slate-900 dark:text-white">NASA FIRMS API Key</h3>
                <p class="text-xs text-slate-500">Configure Earthdata credentials or use free feed</p>
              </div>
            </div>
            <button
              type="button"
              @click="isMapKeyModalOpen = false"
              class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              By default, JerebuAQI automatically fetches the latest 24-hour active fire detections from NASA's high-speed Near Real-Time feeds for Southeast Asia without requiring any key.
            </p>
            <p>
              If you have a dedicated <strong>NASA FIRMS MAP Key</strong>, paste it below to enable custom bounding-box queries and multi-day temporal ranges.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">FIRMS Map Key (32 hex characters)</label>
            <input
              type="text"
              v-model="userMapKeyInput"
              placeholder="e.g. 9a7b8c... (leave empty for free NRT feed)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div class="flex items-center justify-between pt-2">
            <a
              href="https://firms.modaps.eosdis.nasa.gov/api/map_key"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Get Free Key at NASA Earthdata</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div class="flex items-center gap-2">
              <button
                type="button"
                v-if="userMapKeyInput"
                @click="clearMapKey"
                class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Reset to Free Feed
              </button>
              <button
                type="button"
                @click="saveMapKey"
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer transition-all"
              >
                Save & Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed, onUnmounted } from 'vue';
import L from 'leaflet';
import { getAQIColor } from '../data/officialStations.js';
import MapLayerControl from './MapLayerControl.vue';
import SarawakSearchBar from './SarawakSearchBar.vue';
import { calculateDistanceKm } from '../data/sarawakLocations.js';
import { firmsService } from '../services/nasaFirmsService.js';

const props = defineProps({
  officialStations: { type: Array, default: () => [] },
  reports: { type: Array, default: () => [] },
  anomalyClusters: { type: Array, default: () => [] },
  hotspots: { type: Array, default: () => [] },
  windData: { type: Object, default: () => ({ speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' }) },
  divergences: { type: Array, default: () => [] },
  isPickingLocation: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false }
});

const emit = defineEmits([
  'location-selected',
  'cancel-pick',
  'select-report',
  'upvote-report',
  'share-report',
  'report-at-location',
  'open-sync-modal',
  'open-forecast-modal',
  'open-moe-modal',
  'toast',
  'refresh-firms'
]);

let map = null;
let tileLayerInstance = null;
let officialMarkersLayer = null;
let reportsMarkersLayer = null;
let anomalyOverlayLayer = null;
let hotspotsLayer = null;
let windLayer = null;
let divergenceLayer = null;
let gibsWmsLayer = null;
let tempPickMarker = null;
let searchLocationMarker = null;
let currentSearchedLoc = null;

const isFirmsHudExpanded = ref(false);
const isFirmsSyncing = ref(false);
const isMapKeyModalOpen = ref(false);
const userMapKeyInput = ref(firmsService.getMapKey());

const hotspotFilters = ref({
  sensor: 'all', // 'all', 'viirs', 'modis'
  confidence: 'all', // 'all', 'high'
  onlyTransboundary: false,
  showPlumes: true,
  showGibsWms: false
});

const filteredHotspots = computed(() => {
  let list = props.hotspots || [];
  if (hotspotFilters.value.sensor !== 'all') {
    const s = hotspotFilters.value.sensor.toLowerCase();
    list = list.filter(h =>
      (h.sensorType || '').toLowerCase() === s ||
      (s === 'viirs' && (h.satellite || '').includes('VIIRS')) ||
      (s === 'modis' && (h.satellite || '').includes('MODIS'))
    );
  }
  if (hotspotFilters.value.confidence === 'high') {
    list = list.filter(h => h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80));
  }
  if (hotspotFilters.value.onlyTransboundary) {
    list = list.filter(h => h.isTransboundary);
  }
  return list;
});

const visibleHotspotsCount = computed(() => filteredHotspots.value.length);
const totalVisibleFrp = computed(() => Math.round(filteredHotspots.value.reduce((sum, h) => sum + (h.frp || 0), 0)));
const transboundaryCount = computed(() => filteredHotspots.value.filter(h => h.isTransboundary).length);
const apiKeyMasked = computed(() => {
  const k = firmsService.getMapKey();
  if (!k) return 'Free NRT Feed';
  return k.slice(0, 4) + '••••' + k.slice(-3);
});

async function triggerFirmsSync() {
  if (isFirmsSyncing.value) return;
  isFirmsSyncing.value = true;
  emit('toast', '🛰️ Fetching live NASA FIRMS active fire satellite data...');
  try {
    const res = await firmsService.fetchLiveHotspots({
      sensor: hotspotFilters.value.sensor,
      confidence: hotspotFilters.value.confidence,
      refresh: true
    });
    emit('refresh-firms', res);
    emit('toast', `🔥 Synced: ${res.hotspots?.length || 0} active hotspots from NASA FIRMS`);
  } catch (err) {
    emit('toast', `NASA FIRMS notice: ${err.message}`);
  } finally {
    isFirmsSyncing.value = false;
  }
}

function toggleGibsWmsLayer() {
  hotspotFilters.value.showGibsWms = !hotspotFilters.value.showGibsWms;
  if (!map) return;
  if (hotspotFilters.value.showGibsWms) {
    if (!gibsWmsLayer) {
      gibsWmsLayer = L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', {
        layers: 'VIIRS_NOAA20_Thermal_Anomalies_375m_All,MODIS_Combined_Thermal_Anomalies_All',
        format: 'image/png',
        transparent: true,
        opacity: 0.7,
        attribution: 'NASA GIBS / FIRMS'
      });
    }
    if (!map.hasLayer(gibsWmsLayer)) {
      map.addLayer(gibsWmsLayer);
      emit('toast', '🌐 NASA Satellite Thermal (WMS) tile layer activated');
    }
  } else {
    if (gibsWmsLayer && map.hasLayer(gibsWmsLayer)) {
      map.removeLayer(gibsWmsLayer);
    }
  }
}

function openMapKeyDialog() {
  userMapKeyInput.value = firmsService.getMapKey();
  isMapKeyModalOpen.value = true;
}

function saveMapKey() {
  firmsService.setMapKey(userMapKeyInput.value);
  isMapKeyModalOpen.value = false;
  emit('toast', userMapKeyInput.value ? 'NASA FIRMS Map Key saved!' : 'Switched to free Near-Real-Time NASA feed.');
  triggerFirmsSync();
}

function clearMapKey() {
  userMapKeyInput.value = '';
  firmsService.setMapKey('');
  isMapKeyModalOpen.value = false;
  emit('toast', 'Reset to free NASA Near-Real-Time feeds.');
  triggerFirmsSync();
}

const activeRegion = ref('Miri (Hotspot)');
const isRegionDropdownOpen = ref(false);
const isLegendOpen = ref(false);

const dropdownContainer = ref(null);
const legendContainer = ref(null);

const filters = ref({
  official: true,
  community: true,
  anomalies: true,
  hotspots: true,
  wind: true,
  divergence: true
});

const regions = [
  { name: 'Miri (Hotspot)', flag: '🇲🇾', lat: 4.450, lng: 114.020, zoom: 12 },
  { name: 'Kuching', flag: '🇲🇾', lat: 1.5533, lng: 110.3592, zoom: 12 },
  { name: 'Sibu', flag: '🇲🇾', lat: 2.2875, lng: 111.8305, zoom: 12 },
  { name: 'Bintulu', flag: '🇲🇾', lat: 3.1725, lng: 113.0433, zoom: 12 },
  { name: 'Sri Aman', flag: '🇲🇾', lat: 1.2333, lng: 111.4667, zoom: 12 },
  { name: 'Klang Valley', flag: '🇲🇾', lat: 3.100, lng: 101.620, zoom: 11 },
  { name: 'Riau Sumatra', flag: '🇮🇩', lat: 0.507, lng: 101.447, zoom: 9 }
];

const currentRegionObject = computed(() => {
  return regions.find(r => r.name === activeRegion.value) || regions[0];
});

function selectRegion(region) {
  activeRegion.value = region.name;
  isRegionDropdownOpen.value = false;
  if (map) {
    map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.25 });
  }
}

// Close dropdowns when clicking outside
function handleClickOutside(e) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(e.target)) {
    isRegionDropdownOpen.value = false;
  }
  if (legendContainer.value && !legendContainer.value.contains(e.target)) {
    isLegendOpen.value = false;
  }
}

function setTileLayer() {
  if (!map) return;
  if (tileLayerInstance) {
    map.removeLayer(tileLayerInstance);
  }
  
  tileLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  if (tileLayerInstance.bringToBack) {
    tileLayerInstance.bringToBack();
  }
}

function syncLayers(currentFilters = filters.value) {
  if (!map) return;
  
  const manageLayer = (layer, shouldShow) => {
    if (!layer) return;
    if (shouldShow && !map.hasLayer(layer)) map.addLayer(layer);
    else if (!shouldShow && map.hasLayer(layer)) map.removeLayer(layer);
  };

  manageLayer(officialMarkersLayer, currentFilters.official);
  manageLayer(reportsMarkersLayer, currentFilters.community);
  manageLayer(anomalyOverlayLayer, currentFilters.anomalies);
  manageLayer(hotspotsLayer, currentFilters.hotspots);
  manageLayer(windLayer, currentFilters.wind);
  manageLayer(divergenceLayer, currentFilters.divergence);
}

onMounted(() => {
  initMap();
  renderAllLayers();
  syncLayers();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
  document.removeEventListener('click', handleClickOutside);
});

watch(() => props.officialStations, () => renderOfficialMarkers(), { deep: true });
watch(() => props.reports, () => renderReportMarkers(), { deep: true });
watch(() => props.anomalyClusters, () => renderAnomalyClusters(), { deep: true });
watch(() => props.hotspots, () => renderHotspots(), { deep: true });
watch(() => props.windData, () => renderWindVectors(), { deep: true });
watch(() => props.divergences, () => renderDivergences(), { deep: true });
watch(() => props.isDark, () => {
  renderAllLayers();
});
watch(hotspotFilters, () => {
  renderHotspots();
}, { deep: true });

watch(filters, (newVal) => {
  syncLayers(newVal);
}, { deep: true });

function initMap() {
  map = L.map('jerebu-map', {
    center: [4.450, 114.020],
    zoom: 12,
    zoomControl: false,
    preferCanvas: true
  });

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  setTileLayer();

  officialMarkersLayer = L.layerGroup().addTo(map);
  reportsMarkersLayer = L.layerGroup().addTo(map);
  anomalyOverlayLayer = L.layerGroup().addTo(map);
  hotspotsLayer = L.layerGroup().addTo(map);
  windLayer = L.layerGroup().addTo(map);
  divergenceLayer = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    if (props.isPickingLocation) {
      if (tempPickMarker) map.removeLayer(tempPickMarker);
      tempPickMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 12,
        fillColor: '#ea580c',
        color: '#ffffff',
        weight: 3.5,
        fillOpacity: 0.95
      }).addTo(map);

      emit('location-selected', {
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lng: parseFloat(e.latlng.lng.toFixed(5))
      });
    }
  });

  map.getContainer().addEventListener('click', (e) => {
    const shareBtn = e.target.closest('.btn-native-share-report');
    if (shareBtn) {
      e.stopPropagation();
      e.preventDefault();
      const reportId = shareBtn.getAttribute('data-report-id');
      const rep = (props.reports || []).find(r => String(r.id) === String(reportId));
      if (rep) emit('share-report', rep);
      return;
    }

    const reportHereBtn = e.target.closest('.btn-report-here-action');
    if (reportHereBtn) {
      e.stopPropagation();
      e.preventDefault();
      const name = reportHereBtn.getAttribute('data-loc-name');
      const lat = parseFloat(reportHereBtn.getAttribute('data-loc-lat'));
      const lng = parseFloat(reportHereBtn.getAttribute('data-loc-lng'));
      emit('report-at-location', { areaName: name, lat, lng });
      return;
    }

    const syncStationBtn = e.target.closest('.btn-sync-station-action');
    if (syncStationBtn) {
      e.stopPropagation();
      e.preventDefault();
      const stationId = syncStationBtn.getAttribute('data-station-id');
      emit('open-sync-modal', stationId);
      return;
    }

    const forecastBtn = e.target.closest('.btn-forecast-station-action');
    if (forecastBtn) {
      e.stopPropagation();
      e.preventDefault();
      const stationId = forecastBtn.getAttribute('data-station-id');
      emit('open-forecast-modal', stationId);
      return;
    }

    const moeBtn = e.target.closest('.btn-moe-station-action');
    if (moeBtn) {
      e.stopPropagation();
      e.preventDefault();
      const stationId = moeBtn.getAttribute('data-station-id');
      emit('open-moe-modal', stationId);
      return;
    }

    const dismissBtn = e.target.closest('.btn-dismiss-search-pin');
    if (dismissBtn) {
      e.stopPropagation();
      e.preventDefault();
      if (searchLocationMarker && map) {
        map.removeLayer(searchLocationMarker);
        searchLocationMarker = null;
        currentSearchedLoc = null;
      }
      return;
    }

    const focusDriftBtn = e.target.closest('.btn-focus-hotspot-drift');
    if (focusDriftBtn) {
      e.stopPropagation();
      e.preventDefault();
      const lat = parseFloat(focusDriftBtn.getAttribute('data-lat'));
      const lng = parseFloat(focusDriftBtn.getAttribute('data-lng'));
      const endLat = parseFloat(focusDriftBtn.getAttribute('data-end-lat'));
      const endLng = parseFloat(focusDriftBtn.getAttribute('data-end-lng'));
      if (map && !isNaN(lat) && !isNaN(lng)) {
        const bounds = L.latLngBounds([[lat, lng], [endLat, endLng]]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
        emit('toast', '🔎 Zoomed into wind-blown smoke drift corridor');
      }
      return;
    }

    const reportHotspotBtn = e.target.closest('.btn-report-at-hotspot');
    if (reportHotspotBtn) {
      e.stopPropagation();
      e.preventDefault();
      const name = reportHotspotBtn.getAttribute('data-loc-name') || 'Hotspot Corridor';
      const lat = parseFloat(reportHotspotBtn.getAttribute('data-lat'));
      const lng = parseFloat(reportHotspotBtn.getAttribute('data-lng'));
      emit('report-at-location', { areaName: name, lat, lng });
      return;
    }
  });
}

function handleLocationSelected(loc) {
  if (!map) return;
  currentSearchedLoc = loc;

  map.flyTo([loc.lat, loc.lng], loc.zoom || 14, { duration: 1.4 });

  if (searchLocationMarker) {
    map.removeLayer(searchLocationMarker);
    searchLocationMarker = null;
  }

  let nearestStation = null;
  let minDistance = Infinity;
  for (const st of props.officialStations) {
    const d = calculateDistanceKm(loc.lat, loc.lng, st.lat, st.lng);
    if (d < minDistance) {
      minDistance = d;
      nearestStation = st;
    }
  }

  const isDark = props.isDark;
  const pinBorder = isDark ? '#0f172a' : '#ffffff';

  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <div style="
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        border: 3px solid ${pinBorder};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 28px -4px rgba(234, 88, 12, 0.6);
      ">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
  `;

  const searchPinIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-search-highlight-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  });

  searchLocationMarker = L.marker([loc.lat, loc.lng], { icon: searchPinIcon }).addTo(map);

  const nearestInfoHtml = nearestStation
    ? `
      <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400">Nearest Station</span>
          <span class="text-[10px] font-mono text-slate-400 font-semibold">${minDistance} km away</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="font-bold text-slate-800 dark:text-slate-200 truncate mr-2">${nearestStation.name}</span>
          <span class="font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">${nearestStation.aqi} AQI</span>
        </div>
      </div>
    `
    : '';

  const popupHtml = `
    <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[260px] max-w-[320px]">
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <span class="text-[10px] font-extrabold px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 rounded-lg uppercase tracking-wide">
          ${loc.division || 'Sarawak'}
        </span>
        <span class="text-[10px] font-mono text-slate-400">${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°</span>
      </div>
      <div class="text-base font-black text-slate-900 dark:text-white leading-snug">${loc.name}</div>
      ${loc.description ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${loc.description}</div>` : ''}
      
      ${nearestInfoHtml}

      <div class="mt-4 flex items-center gap-2">
        <button
          type="button"
          class="btn-report-here-action flex-1 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold text-center cursor-pointer shadow-md shadow-orange-500/20 transition-all active:scale-95"
          data-loc-name="${loc.name}"
          data-loc-lat="${loc.lat}"
          data-loc-lng="${loc.lng}"
        >
          Report Haze Here
        </button>
        <button
          type="button"
          class="btn-dismiss-search-pin p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-semibold cursor-pointer transition-all"
          title="Dismiss pin"
        >
          ✕
        </button>
      </div>
    </div>
  `;

  searchLocationMarker.bindPopup(popupHtml, { maxWidth: 320 }).openPopup();
  emit('toast', `📍 Centered map on ${loc.name} (${loc.division || 'Sarawak'})`);
}

function renderAllLayers() {
  renderOfficialMarkers();
  renderReportMarkers();
  renderAnomalyClusters();
  renderHotspots();
  renderWindVectors();
  renderDivergences();
}

function renderOfficialMarkers() {
  if (!officialMarkersLayer) return;
  officialMarkersLayer.clearLayers();

  const isDark = props.isDark;
  const badgeBorder = isDark ? '#0f172a' : '#ffffff';
  const labelBg = isDark ? '#0f172a' : '#ffffff';
  const labelText = isDark ? '#f8fafc' : '#1e293b';
  const labelBorder = isDark ? '#334155' : '#e2e8f0';

  for (const st of props.officialStations) {
    const colorInfo = getAQIColor(st.aqi);

    const iconHtml = `
      <div class="flex flex-col items-center group cursor-pointer">
        <div style="
          background-color: ${colorInfo.bg};
          color: #ffffff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3.5px solid ${badgeBorder};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px -4px rgba(0, 0, 0, 0.3);
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 13px;
        ">
          ${st.aqi}
        </div>
        <div style="
          background-color: ${labelBg};
          color: ${labelText};
          border: 1px solid ${labelBorder};
        " class="px-2.5 py-0.5 rounded-lg shadow-sm text-[10px] font-bold mt-1 whitespace-nowrap">
          ${st.city || st.name.split(' ')[0]}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-official-pin',
      iconSize: [60, 60],
      iconAnchor: [30, 22]
    });

    const marker = L.marker([st.lat, st.lng], { icon: customIcon });

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[260px]">
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span class="text-[10px] uppercase font-black tracking-widest text-slate-400">Official Station</span>
          <span class="text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase" style="background:${colorInfo.bg}20; color:${colorInfo.bg}; border: 1px solid ${colorInfo.bg}40;">${colorInfo.label}</span>
        </div>
        <div class="text-base font-bold text-slate-900 dark:text-white mb-0.5">${st.name}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3.5">${st.source}</div>

        <div class="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-3.5">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Reading (AQI)</div>
            <div class="text-2xl font-mono font-extrabold" style="color: ${colorInfo.bg}">${st.aqi}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">PM2.5 Level</div>
            <div class="text-lg font-mono font-extrabold text-slate-700 dark:text-slate-200">${st.pm25} <span class="text-[10px] font-normal text-slate-400">µg/m³</span></div>
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">${st.description}</div>
        <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-2.5">Updated: ${st.updatedAt}</div>

        <button
          type="button"
          class="btn-sync-station-action w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
          data-station-id="${st.id}"
        >
          <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Live Sync IQAir / DOE Feed</span>
        </button>

        <div class="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn-forecast-station-action py-2 px-2.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:hover:bg-orange-900/80 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            data-station-id="${st.id}"
          >
            <span>📈 Forecast</span>
          </button>
          <button
            type="button"
            class="btn-moe-station-action py-2 px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            data-station-id="${st.id}"
          >
            <span>🏫 MOE SOP</span>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    officialMarkersLayer.addLayer(marker);
  }
  syncLayers();
}

function renderReportMarkers() {
  if (!reportsMarkersLayer) return;
  reportsMarkersLayer.clearLayers();

  const isDark = props.isDark;
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardText = isDark ? '#f8fafc' : '#0f172a';
  const cardBorder = isDark ? '#334155' : '#cbd5e1';

  for (const rep of props.reports) {
    const iconHtml = `
      <div class="flex flex-col items-center cursor-pointer group">
        <div style="
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: #ffffff;
          border: 3.5px solid ${isDark ? '#0f172a' : '#ffffff'};
          box-shadow: 0 8px 20px -4px rgba(234, 88, 12, 0.5);
        " class="px-3.5 py-2 rounded-2xl font-mono font-black text-xs flex flex-col items-center leading-tight">
          <span>${rep.estimatedAqi}</span>
          <span class="text-[9px] font-bold tracking-wider opacity-90">AQI</span>
        </div>
        <div style="
          background-color: ${cardBg};
          color: ${cardText};
          border: 1px solid ${cardBorder};
        " class="text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm mt-1 whitespace-nowrap">
          ${rep.areaName}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-report-badge-marker',
      iconSize: [80, 50],
      iconAnchor: [40, 24]
    });

    const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });

    const symptomsHtml = (rep.symptoms || [])
      .map(s => `<span class="inline-block px-2.5 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/80 text-orange-800 dark:text-orange-200 text-[10px] font-bold mr-1 mb-1">${s}</span>`)
      .join('');

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[280px]">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <span class="text-[10px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-400">Ground Truth Report</span>
          <span class="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">Weight: ${rep.trustScore}x</span>
        </div>

        <div class="text-base font-bold text-slate-900 dark:text-white mb-0.5">${rep.areaName}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3.5">By <span class="text-slate-800 dark:text-slate-200 font-semibold">${rep.reporterName}</span> (${rep.reporterRole})</div>

        <div class="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-3.5">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Visibility</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">${rep.visibilityLabel}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Burning Odor</div>
            <div class="text-xs font-bold text-orange-600 dark:text-orange-400">${rep.smellLevel}</div>
          </div>
        </div>

        <div class="text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-orange-500 pl-3 py-1.5 mb-3.5 bg-orange-50/40 dark:bg-orange-950/20 rounded-r-xl">
          "${rep.description}"
        </div>

        <div class="mb-3.5">
          <div class="text-[10px] uppercase text-slate-400 font-bold mb-1.5">Symptoms:</div>
          <div class="flex flex-wrap">${symptomsHtml || '<span class="text-xs text-slate-400">None reported</span>'}</div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 text-[11px] text-slate-400">
          <span>${rep.timestamp}</span>
          <span class="text-orange-600 dark:text-orange-400 font-bold font-mono">Panic: ${rep.panicScore}%</span>
        </div>

        <div class="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            class="btn-native-share-report flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all cursor-pointer select-none active:scale-95"
            data-report-id="${rep.id}"
          >
            <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
            <span>Share Air Quality Card</span>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    reportsMarkersLayer.addLayer(marker);

    if (rep.visibilityMeters < 1000) {
      const circle = L.circle([rep.lat, rep.lng], {
        radius: rep.visibilityMeters,
        color: '#ea580c',
        fillColor: '#ea580c',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '3, 3'
      });
      reportsMarkersLayer.addLayer(circle);
    }
  }
  syncLayers();
}

function renderAnomalyClusters() {
  if (!anomalyOverlayLayer) return;
  anomalyOverlayLayer.clearLayers();

  const isDark = props.isDark;
  const areaBg = isDark ? '#0f172a' : 'rgba(255, 255, 255, 0.95)';
  const areaText = isDark ? '#f8fafc' : '#1e293b';
  const areaBorder = isDark ? '#334155' : '#e2e8f0';

  for (const anomaly of props.anomalyClusters) {
    if (!anomaly.isAnomaly) continue;

    const outerCircle = L.circle(anomaly.center, {
      radius: anomaly.radiusMeters,
      color: '#ea580c',
      fillColor: '#f97316',
      fillOpacity: isDark ? 0.25 : 0.18,
      weight: 2,
      dashArray: '6, 6'
    });

    const innerCircle = L.circle(anomaly.center, {
      radius: Math.max(Math.round(anomaly.radiusMeters * 0.45), 750),
      color: '#dc2626',
      fillColor: '#ef4444',
      fillOpacity: isDark ? 0.40 : 0.30,
      weight: 2
    });

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-orange-200 dark:border-orange-800/80 shadow-2xl min-w-[280px]">
        <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5 text-orange-600 dark:text-orange-400">
          <span class="text-xs font-black uppercase tracking-widest">DBSCAN Smoke Spike</span>
        </div>
        <div class="text-base font-bold text-slate-900 dark:text-white mb-1">${anomaly.area}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3.5">${anomaly.reportCount} localized citizen reports confirm heavy smoke concentrations.</div>

        <div class="bg-orange-50/80 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 rounded-2xl p-3 mb-3.5 space-y-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Citizen Weighted AQI:</span>
            <span class="font-mono font-bold text-orange-900 dark:text-orange-300">${anomaly.groundTruthAqi}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Nearest Gov Station:</span>
            <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${anomaly.nearestStation?.name} (${anomaly.nearestStation?.aqi || 'N/A'})</span>
          </div>
          <div class="flex justify-between border-t border-orange-200/60 dark:border-orange-800/60 pt-1.5 font-bold">
            <span class="text-orange-900 dark:text-orange-300">Blindspot Discrepancy:</span>
            <span class="font-mono text-red-600 dark:text-red-400">+${anomaly.discrepancy} AQI</span>
          </div>
        </div>

        <div class="text-[10px] text-slate-400 font-mono">
          Model: eps=${anomaly.parameters?.epsKm ?? 8}km, minPts=${anomaly.parameters?.minPts ?? 5}
        </div>
      </div>
    `;

    outerCircle.bindPopup(popupHtml);
    innerCircle.bindPopup(popupHtml);

    const centerIcon = L.divIcon({
      className: 'custom-anomaly-pin',
      html: `
        <div class="flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
          <div class="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 pointer-events-auto"></div>
          <div class="relative -mt-9 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md text-white font-mono text-[10px] font-bold shadow-xl border border-slate-700 flex items-center gap-2 whitespace-nowrap pointer-events-auto">
            <span>SPIKE +${anomaly.discrepancy} AQI</span>
          </div>
          <div style="background-color: ${areaBg}; color: ${areaText}; border: 1px solid ${areaBorder};" class="text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-sm mt-1 whitespace-nowrap pointer-events-auto">
            ${anomaly.area}
          </div>
        </div>
      `,
      iconSize: [0, 0]
    });

    const centerMarker = L.marker(anomaly.center, { icon: centerIcon });
    centerMarker.bindPopup(popupHtml);

    anomalyOverlayLayer.addLayer(outerCircle);
    anomalyOverlayLayer.addLayer(innerCircle);
    anomalyOverlayLayer.addLayer(centerMarker);
  }
  syncLayers();
}

function renderHotspots() {
  if (!hotspotsLayer) return;
  hotspotsLayer.clearLayers();

  const isDark = props.isDark;
  const wind = props.windData || { speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' };
  const windDeg = wind.directionDeg ?? 215;
  const windSpeed = Math.max(wind.speedKmh ?? 14.5, 5);
  // Wind direction: blowing towards (windDeg + 180) % 360
  const driftAzimuth = (windDeg + 180) % 360;
  const driftRad = (driftAzimuth * Math.PI) / 180;

  const list = filteredHotspots.value;

  for (const h of list) {
    const isTrans = h.isTransboundary;
    const isHigh = h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80);
    const isViirs = (h.sensorType || '').toLowerCase() === 'viirs' || (h.satellite || '').includes('VIIRS') || (h.instrument || '').includes('VIIRS');
    const sensorLabel = isViirs ? 'VIIRS 375m' : 'MODIS 1km';
    const frpValue = h.frp ? Math.round(h.frp) : (isHigh ? 45 : 18);

    const flameHtml = `
      <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2">
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${isHigh ? 'bg-rose-500/40 animate-ping' : 'bg-amber-500/30'}"></div>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr ${isHigh ? 'from-rose-600 via-red-600 to-amber-500' : 'from-amber-600 to-yellow-500'} border-2 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-sm font-black text-white select-none">
            🔥
          </div>
          <span class="absolute -top-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-black ${isTrans ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'} ring-1 ring-white/50">
            ${isTrans ? 'IND' : 'MY'}
          </span>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white font-mono text-[9px] font-bold border border-slate-700 shadow-md whitespace-nowrap flex items-center gap-1">
          <span>${frpValue} MW</span>
          <span class="text-slate-400 font-sans text-[8px]">${isViirs ? '375m' : '1km'}</span>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: flameHtml,
      className: 'custom-hotspot-pin',
      iconSize: [0, 0]
    });

    const marker = L.marker([h.lat, h.lng], { icon });

    // Distance to Kuching
    const distToKuching = h.distanceToKuchingKm ?? Math.round(calculateDistanceKm(h.lat, h.lng, 1.5533, 110.3592));
    const estTransitHours = Math.round(distToKuching / windSpeed);

    // Projected Smoke Drift Trajectory
    const driftKm = Math.min(Math.max((h.frp || 20) * 2, 45), 110);
    const endLat = h.lat + (driftKm / 111) * Math.cos(driftRad);
    const endLng = h.lng + (driftKm / (111 * Math.cos(h.lat * Math.PI / 180))) * Math.sin(driftRad);

    // Lateral dispersion cone points
    const coneAngle = (14 * Math.PI) / 180;
    const leftRad = driftRad - coneAngle;
    const rightRad = driftRad + coneAngle;
    const leftLat = h.lat + (driftKm * 0.9 / 111) * Math.cos(leftRad);
    const leftLng = h.lng + (driftKm * 0.9 / (111 * Math.cos(h.lat * Math.PI / 180))) * Math.sin(leftRad);
    const rightLat = h.lat + (driftKm * 0.9 / 111) * Math.cos(rightRad);
    const rightLng = h.lng + (driftKm * 0.9 / (111 * Math.cos(h.lat * Math.PI / 180))) * Math.sin(rightRad);

    if (hotspotFilters.value.showPlumes) {
      const plumePolygon = L.polygon([
        [h.lat, h.lng],
        [leftLat, leftLng],
        [endLat, endLng],
        [rightLat, rightLng]
      ], {
        color: isTrans ? '#ef4444' : '#f97316',
        fillColor: isTrans ? '#f87171' : '#fb923c',
        fillOpacity: isDark ? 0.12 : 0.08,
        weight: 1,
        dashArray: '3, 5'
      });
      hotspotsLayer.addLayer(plumePolygon);
    }

    // Centerline drift trajectory
    const driftLine = L.polyline([[h.lat, h.lng], [endLat, endLng]], {
      color: isTrans ? '#ef4444' : '#f97316',
      weight: 2.5,
      opacity: 0.7,
      dashArray: '5, 5'
    });
    hotspotsLayer.addLayer(driftLine);

    // Thermal glow circle
    const glowCircle = L.circle([h.lat, h.lng], {
      radius: Math.max((h.frp || 20) * 120, 2500),
      color: isTrans ? '#ef4444' : '#f97316',
      fillColor: isTrans ? '#ef4444' : '#f97316',
      fillOpacity: isDark ? 0.12 : 0.08,
      weight: 1
    });
    hotspotsLayer.addLayer(glowCircle);

    const displayName = h.locationName || h.areaName || 'Active Fire Hotspot';
    const countryName = h.country || (isTrans ? 'West Kalimantan, Indonesia' : 'Sarawak, Malaysia');
    const brightnessC = h.brightness ? Math.round(h.brightness - 273.15) : null;

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-rose-200/80 dark:border-rose-900/80 shadow-2xl min-w-[280px] max-w-[320px]">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span>🛰️</span> NASA FIRMS Active Fire
          </span>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg ${isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}">
            ${isHigh ? 'HIGH CONFIDENCE (≥80%)' : 'NOMINAL CONFIDENCE'}
          </span>
        </div>

        <div class="text-base font-bold text-slate-900 dark:text-white leading-snug">${displayName}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5 flex items-center gap-1 flex-wrap">
          <span>${countryName}</span>
          ${isTrans ? '<span class="px-1.5 py-0.2 rounded font-black text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">⚠️ TRANSBOUNDARY ORIGIN</span>' : '<span class="px-1.5 py-0.2 rounded font-bold text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">🔥 LOCAL PEAT BURN</span>'}
        </div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-2.5 text-xs">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Fire Power (FRP)</div>
            <div class="text-sm font-mono font-black text-rose-600 dark:text-rose-400">${frpValue} MW</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Brightness Temp</div>
            <div class="text-sm font-mono font-black text-amber-600 dark:text-amber-400">${h.brightness ? `${h.brightness} K (${brightnessC}°C)` : 'N/A'}</div>
          </div>
        </div>

        <div class="p-2.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/60 text-xs mb-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Satellite Sensor:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${h.satellite || 'VIIRS NOAA-20'} (${sensorLabel})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Distance to Kuching:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${distToKuching} km</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Detection Pass:</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">${h.acqDate || 'Today'} ${h.acqTime || 'UTC'} (${h.dayNight === 'D' ? 'Day' : 'Night'})</span>
          </div>
          <div class="flex justify-between border-t border-orange-200/60 dark:border-orange-800/60 pt-1 text-[11px]">
            <span class="text-slate-600 dark:text-slate-300 font-semibold">Smoke Drift:</span>
            <span class="font-bold text-orange-600 dark:text-orange-400">Towards ${props.windData?.directionLabel || 'NE'} (~${estTransitHours}h transit)</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-focus-hotspot-drift flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold text-center cursor-pointer transition-all"
            data-lat="${h.lat}"
            data-lng="${h.lng}"
            data-end-lat="${endLat}"
            data-end-lng="${endLng}"
          >
            🔎 Zoom Smoke Corridor
          </button>
          <button
            type="button"
            class="btn-report-at-hotspot py-2 px-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer shadow-md shadow-rose-500/20 transition-all"
            data-loc-name="${displayName}"
            data-lat="${h.lat}"
            data-lng="${h.lng}"
            title="Submit citizen report for this area"
          >
            Report Here
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 320 });
    hotspotsLayer.addLayer(marker);
  }
}

function renderWindVectors() {
  if (!windLayer) return;
  windLayer.clearLayers();

  const wind = props.windData || { speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' };
  const blowTowardDeg = (wind.directionDeg + 180) % 360;

  // Grid points across Borneo & Sarawak (South China Sea to interior)
  const minLat = 1.0, maxLat = 4.6, stepLat = 0.9;
  const minLng = 109.8, maxLng = 115.2, stepLng = 1.1;

  for (let lat = minLat; lat <= maxLat; lat += stepLat) {
    for (let lng = minLng; lng <= maxLng; lng += stepLng) {
      const localVar = Math.sin(lat * 4) * 6;
      const angle = (blowTowardDeg + localVar) % 360;

      const vectorHtml = `
        <div class="pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 transition-opacity">
          <div style="transform: rotate(${angle}deg);" class="transition-transform duration-700">
            <svg class="w-7 h-7 text-sky-500 dark:text-sky-400 drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-4 4m4-4l4 4" />
            </svg>
          </div>
          <div class="text-[9px] font-mono font-bold text-sky-700 dark:text-sky-300 bg-white/80 dark:bg-slate-900/80 px-1 py-0.2 rounded shadow-xs border border-sky-300/40 whitespace-nowrap">
            ${wind.speedKmh} km/h
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: vectorHtml,
        className: 'custom-wind-vector-pin',
        iconSize: [0, 0]
      });

      const marker = L.marker([lat, lng], { icon, interactive: false });
      windLayer.addLayer(marker);
    }
  }
}

function renderDivergences() {
  if (!divergenceLayer) return;
  divergenceLayer.clearLayers();

  for (const div of props.divergences) {
    if (!div.isDivergent) continue;

    const outerCircle = L.circle([div.lat, div.lng], {
      radius: 9000,
      color: '#eab308',
      fillColor: '#eab308',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 5'
    });

    const badgeHtml = `
      <div class="flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="relative px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-[10px] shadow-xl border border-amber-300 flex items-center gap-1.5 whitespace-nowrap pointer-events-auto">
          <span>⚠️</span>
          <span>+${div.deltaAqi} AQI Divergence</span>
        </div>
      </div>
    `;

    const badgeIcon = L.divIcon({
      html: badgeHtml,
      className: 'custom-divergence-pin',
      iconSize: [0, 0]
    });

    const popupHtml = `
      <div class="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-3xl border border-amber-200 dark:border-amber-800 shadow-2xl min-w-[270px]">
        <div class="text-xs font-black uppercase text-amber-600 dark:text-amber-400 mb-1">Reality Check Divergence</div>
        <div class="text-base font-bold text-slate-900 dark:text-white mb-2">${div.stationName}</div>
        <div class="space-y-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 mb-2.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Official Sensor:</span>
            <span class="font-bold">${div.officialAqi} AQI</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Citizen Reports:</span>
            <span class="font-bold text-orange-600">${div.citizenAqi} AQI</span>
          </div>
          <div class="flex justify-between border-t border-amber-200/60 pt-1">
            <span class="font-semibold text-amber-900 dark:text-amber-200">Discrepancy:</span>
            <span class="font-mono font-bold text-red-600">+${div.deltaAqi} AQI</span>
          </div>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${div.reason || 'Local low-lying smoke trapped by humidity while elevated sensor shows lower values.'}</div>
      </div>
    `;

    const marker = L.marker([div.lat, div.lng], { icon: badgeIcon });
    marker.bindPopup(popupHtml);
    outerCircle.bindPopup(popupHtml);

    divergenceLayer.addLayer(outerCircle);
    divergenceLayer.addLayer(marker);
  }
}
</script>

<style scoped>
:deep(.custom-report-badge-marker),
:deep(.custom-official-pin),
:deep(.custom-anomaly-pin),
:deep(.custom-search-highlight-pin),
:deep(.custom-hotspot-pin),
:deep(.custom-wind-vector-pin),
:deep(.custom-divergence-pin) {
  background: transparent;
  border: none;
}
</style>