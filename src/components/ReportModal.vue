<template>
  <div class="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
    <div class="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4 select-none">

      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900 leading-tight">Submit Ground Truth Haze Report</h2>
              <span class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">Live Feed</span>
            </div>
            <p class="text-xs text-slate-500">Provide real-time localized qualitative observations to bridge official sensor blind spots</p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 max-h-[78vh] overflow-y-auto">

        <!-- Active Persona / Trust Weight Banner -->
        <div class="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Submitting as:</span>
            <span class="font-bold text-slate-900">{{ activeUser.name }}</span>
            <span class="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700 font-medium">{{ activeUser.role }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-700">
            <span class="text-slate-500">Reputation Weight:</span>
            <span class="font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-mono">{{ activeUser.trustWeight }}x</span>
          </div>
        </div>

        <!-- ACCORDION SECTIONS (1 TO 5) -->
        <div class="space-y-3">

          <!-- SECTION 1: QUALITATIVE INTENSITY -->
          <div class="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              type="button"
              @click="toggleSection('intensity')"
              class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-700">1. Qualitative Air Quality Intensity</span>
                <span class="text-red-500">*</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="selectedIntensityBadgeClass">
                  {{ form.intensityLabel }} (Est. AQI {{ form.intensityScore }})
                </span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': openSections.intensity }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>

            <div v-show="openSections.intensity" class="p-4 pt-2 border-t border-slate-100 bg-white">
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  v-for="item in intensityLevels"
                  :key="item.id"
                  @click="selectIntensity(item)"
                  :class="[
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden',
                    form.intensityLevel === item.id
                      ? `${item.activeClass} shadow-md ring-2 ring-offset-1`
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  ]"
                >
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500">{{ item.label }}</span>
                      <span class="text-[10px] font-mono font-bold opacity-75">{{ item.aqiRange }}</span>
                    </div>
                    <div class="text-xs font-black tracking-tight leading-tight">{{ item.malayLabel }}</div>
                  </div>
                  <div class="text-[9px] mt-2 opacity-80 leading-snug font-normal line-clamp-2">
                    {{ item.qualitativeDescription }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 2: LOCATION TAGGING -->
          <div class="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              type="button"
              @click="toggleSection('location')"
              class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-700">2. Location Tagging</span>
                <span class="text-red-500">*</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-500 truncate max-w-[180px] font-medium">{{ form.areaName || 'Not set' }}</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': openSections.location }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>

            <div v-show="openSections.location" class="p-4 pt-2 border-t border-slate-100 bg-white space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-[10px] uppercase font-bold text-slate-400">Quick Neighborhood Tags</div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="locateWithGPS"
                    :disabled="isLocatingGPS"
                    class="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span v-if="isLocatingGPS" class="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    <svg v-else class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ gpsStatusText }}</span>
                  </button>

                  <button
                    type="button"
                    @click="startMapPicker"
                    class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>Pick on Map</span>
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  v-for="preset in locationPresets"
                  :key="preset.name"
                  @click="applyLocationPreset(preset)"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-left border text-[11px] transition-all cursor-pointer truncate',
                    form.areaName === preset.name
                      ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  ]"
                >
                  <span>{{ preset.name }}</span>
                </button>
              </div>

              <div>
                <input
                  type="text"
                  v-model="form.areaName"
                  placeholder="Enter neighborhood or landmark (e.g. Taman Tunku, Senadin Phase 3)"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div class="flex items-center gap-3">
                  <span>Latitude: <strong class="text-slate-700 font-semibold">{{ form.lat.toFixed(4) }}</strong></span>
                  <span>Longitude: <strong class="text-slate-700 font-semibold">{{ form.lng.toFixed(4) }}</strong></span>
                </div>
                <span class="text-[10px] text-slate-400">Indexed into Redis GEO: <code class="text-orange-600">haze:reports:geo</code></span>
              </div>
            </div>
          </div>

          <!-- SECTION 3 & 4: VISIBILITY & ODOR SENSORY METRICS -->
          <div class="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              type="button"
              @click="toggleSection('sensory')"
              class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700">3. Estimated Visibility & Burning Odor</span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-500 font-medium">{{ form.visibilityLabel }} / {{ form.smellLevel }}</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': openSections.sensory }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>

            <div v-show="openSections.sensory" class="p-4 pt-2 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Visibility Rating -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Visibility</label>
                  <span class="text-xs font-bold text-orange-600 font-mono">{{ form.visibilityLabel }}</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    v-for="opt in visibilityOptions"
                    :key="opt.meters"
                    @click="selectVisibility(opt)"
                    :class="[
                      'p-2 rounded-xl border text-center transition-all cursor-pointer',
                      form.visibilityMeters === opt.meters
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    ]"
                  >
                    <div class="font-bold text-xs">{{ opt.label }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">{{ opt.distance }}</div>
                  </button>
                </div>
              </div>

              <!-- Smell Level of Burning -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Burning Odor (Bau Hangit)</label>
                  <span class="text-xs font-bold text-orange-600 font-mono">{{ form.smellLevel }}</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    v-for="smell in smellOptions"
                    :key="smell.score"
                    @click="form.smellScore = smell.score; form.smellLevel = smell.label"
                    :class="[
                      'p-2 rounded-xl border text-left transition-all cursor-pointer',
                      form.smellScore === smell.score
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    ]"
                  >
                    <div class="font-bold text-xs">{{ smell.label }}</div>
                    <div class="text-[10px] text-slate-400 leading-tight">{{ smell.desc }}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 4: PHYSICAL HEALTH SYMPTOMS -->
          <div class="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              type="button"
              @click="toggleSection('symptoms')"
              class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700">4. Observable Health Symptoms in Area</span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-500 font-medium">{{ form.symptoms.length }} selected</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': openSections.symptoms }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>

            <div v-show="openSections.symptoms" class="p-4 pt-2 border-t border-slate-100 bg-white">
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  v-for="sym in availableSymptoms"
                  :key="sym"
                  @click="toggleSymptom(sym)"
                  :class="[
                    'px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer',
                    form.symptoms.includes(sym)
                      ? 'border-rose-300 bg-rose-50 text-rose-800 font-bold shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  ]"
                >
                  {{ sym }}
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 5: QUALITATIVE DESCRIPTION & NLP -->
          <div class="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              type="button"
              @click="toggleSection('remarks')"
              class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700">5. Qualitative Citizen Remarks & NLP Analysis</span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-mono font-bold text-orange-600">{{ liveSentiment.panicScore }}% Panic</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': openSections.remarks }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>

            <div v-show="openSections.remarks" class="p-4 pt-2 border-t border-slate-100 bg-white space-y-3">
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="e.g. Visibility is poor in Taman Tunku. Smell of burning is strong in Senadin area. Can barely see down the residential street, eyes are stinging..."
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed font-normal"
              ></textarea>

              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <div class="space-y-0.5">
                  <div class="text-[10px] uppercase font-bold text-slate-400">FastAPI Sentiment & Panic Score</div>
                  <div class="text-slate-700 font-medium text-xs">
                    Classification: <span class="font-bold text-orange-600">{{ liveSentiment.panicTier }}</span>
                  </div>
                  <div class="text-[10px] text-slate-400">
                    Trigger terms: {{ liveSentiment.detectedSignals.join(', ') || 'none detected yet' }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-mono font-black text-orange-600">{{ liveSentiment.panicScore }}%</div>
                  <div class="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Panic Index</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Action Buttons -->
        <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            @click="$emit('close')"
            class="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:shadow-lg"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Publish Ground Report & Index Redis</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { fastapi } from '../services/fastapiEngine.js';

const props = defineProps({
  activeUser: { type: Object, required: true },
  initialCoords: { type: Object, default: () => ({ lat: 4.450, lng: 114.020 }) },
  initialAreaName: { type: String, default: '' }
});

const emit = defineEmits(['close', 'submit-report', 'request-map-pick']);

const isSubmitting = ref(false);
const isLocatingGPS = ref(false);
const gpsStatusText = ref('Use My GPS');

// Accordion collapse state manager (Section 1 open by default)
const openSections = reactive({
  intensity: true,
  location: false,
  sensory: false,
  symptoms: false,
  remarks: false
});

function toggleSection(sectionKey) {
  openSections[sectionKey] = !openSections[sectionKey];
}

// Qualitative Air Quality Intensity Levels (Emojis Removed)
const intensityLevels = [
  {
    id: 'moderate',
    label: 'Moderate',
    malayLabel: 'Sederhana',
    aqiRange: '80-120',
    score: 95,
    qualitativeDescription: 'Faint haze, distant hills slightly pale, sky tinted grey-yellow.',
    activeClass: 'border-amber-400 bg-amber-50 text-amber-950 ring-amber-400/50'
  },
  {
    id: 'unhealthy',
    label: 'Unhealthy',
    malayLabel: 'Tidak Sihat',
    aqiRange: '121-175',
    score: 155,
    qualitativeDescription: 'Visible smoke layer, buildings >1km blurred, throat scratchy.',
    activeClass: 'border-orange-500 bg-orange-50 text-orange-950 ring-orange-400/50'
  },
  {
    id: 'very_unhealthy',
    label: 'Very Unhealthy',
    malayLabel: 'Sangat Tidak Sihat',
    aqiRange: '176-240',
    score: 215,
    qualitativeDescription: 'Thick smoky air, stung eyes, street visibility <500m, stay indoors.',
    activeClass: 'border-rose-500 bg-rose-50 text-rose-950 ring-rose-400/50'
  },
  {
    id: 'hazardous',
    label: 'Hazardous',
    malayLabel: 'Bahaya Peat',
    aqiRange: '241-320',
    score: 280,
    qualitativeDescription: 'Suffocating peat smoke, ash falling, severe cough, visibility <300m.',
    activeClass: 'border-purple-500 bg-purple-50 text-purple-950 ring-purple-400/50'
  },
  {
    id: 'emergency',
    label: 'Emergency',
    malayLabel: 'Kecemasan',
    aqiRange: '> 320',
    score: 360,
    qualitativeDescription: 'Dense toxic plume, street obscured <100m, immediate respiratory hazard.',
    activeClass: 'border-red-600 bg-red-50 text-red-950 ring-red-500/50'
  }
];

const locationPresets = [
  { name: 'Taman Tunku, Miri', city: 'Miri', region: 'Sarawak', lat: 4.3521, lng: 113.9845 },
  { name: 'Senadin Phase 2, Miri', city: 'Miri', region: 'Sarawak', lat: 4.5132, lng: 114.0321 },
  { name: 'Kuala Baram Industrial', city: 'Miri', region: 'Sarawak', lat: 4.5689, lng: 114.0450 },
  { name: 'Permyjaya Commercial, Miri', city: 'Miri', region: 'Sarawak', lat: 4.4690, lng: 114.0150 },
  { name: 'Shah Alam Seksyen 13', city: 'Shah Alam', region: 'Selangor', lat: 3.0805, lng: 101.5312 },
  { name: 'Cheras South, KL', city: 'Kuala Lumpur', region: 'Kuala Lumpur', lat: 3.0980, lng: 101.7390 },
  { name: 'Kota Samarahan', city: 'Kota Samarahan', region: 'Sarawak', lat: 1.4580, lng: 110.4502 }
];

const visibilityOptions = [
  { label: 'Severe', distance: '< 300m', meters: 300 },
  { label: 'Very Poor', distance: '< 500m', meters: 500 },
  { label: 'Poor', distance: '< 1 km', meters: 1000 },
  { label: 'Moderate', distance: '1 - 3 km', meters: 2000 }
];

const smellOptions = [
  { score: 1, label: 'None', desc: 'No smoke detected' },
  { score: 2, label: 'Faint Smoke', desc: 'Slight wood smoke' },
  { score: 4, label: 'Acrid Burning', desc: 'Bau hangit / stung eyes' },
  { score: 5, label: 'Peat Fire (Severe)', desc: 'Suffocating thick plume' }
];

const availableSymptoms = [
  'Eye Sting (Pedih Mata)',
  'Dry / Sore Throat',
  'Severe Coughing',
  'Difficulty Breathing',
  'Ash on Car / Balcony',
  'Chest Tightness',
  'Headache'
];

const form = reactive({
  intensityLevel: 'unhealthy',
  intensityLabel: 'Unhealthy',
  intensityScore: 155,
  areaName: props.initialAreaName || 'Taman Tunku, Miri',
  city: 'Miri',
  region: 'Sarawak',
  lat: props.initialCoords.lat || 4.3521,
  lng: props.initialCoords.lng || 113.9845,
  visibilityMeters: 500,
  visibilityLabel: 'Very Poor (< 500m)',
  smellScore: 4,
  smellLevel: 'Acrid Burning',
  symptoms: ['Eye Sting (Pedih Mata)', 'Severe Coughing'],
  description: 'Visibility is poor in Taman Tunku. Smell of burning is strong in Senadin area. Can barely see down the residential street.'
});

const selectedIntensityBadgeClass = computed(() => {
  switch (form.intensityLevel) {
    case 'moderate': return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'unhealthy': return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'very_unhealthy': return 'bg-rose-100 text-rose-800 border border-rose-200';
    case 'hazardous': return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'emergency': return 'bg-red-100 text-red-800 border border-red-200';
    default: return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
});

watch(() => props.initialCoords, (newCoords) => {
  if (newCoords && newCoords.lat) {
    form.lat = newCoords.lat;
    form.lng = newCoords.lng;
  }
}, { deep: true });

watch(() => props.initialAreaName, (newArea) => {
  if (newArea) {
    form.areaName = newArea;
  }
});

const liveSentiment = computed(() => {
  return fastapi.analyzeSentiment(
    form.description,
    form.symptoms,
    form.visibilityMeters,
    form.smellScore
  );
});

function selectIntensity(item) {
  form.intensityLevel = item.id;
  form.intensityLabel = item.label;
  form.intensityScore = item.score;
}

function applyLocationPreset(preset) {
  form.areaName = preset.name;
  form.city = preset.city;
  form.region = preset.region;
  form.lat = preset.lat;
  form.lng = preset.lng;
}

function selectVisibility(opt) {
  form.visibilityMeters = opt.meters;
  form.visibilityLabel = `${opt.label} (${opt.distance})`;
}

function toggleSymptom(sym) {
  const idx = form.symptoms.indexOf(sym);
  if (idx === -1) form.symptoms.push(sym);
  else form.symptoms.splice(idx, 1);
}

function startMapPicker() {
  emit('request-map-pick');
}

function locateWithGPS() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  isLocatingGPS.value = true;
  gpsStatusText.value = 'Locating...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = position.coords.latitude;
      form.lng = position.coords.longitude;
      form.areaName = `Current Location (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`;
      isLocatingGPS.value = false;
      gpsStatusText.value = 'GPS Tagged';
      setTimeout(() => {
        gpsStatusText.value = 'Use My GPS';
      }, 4000);
    },
    (err) => {
      console.warn('Geolocation error:', err);
      isLocatingGPS.value = false;
      gpsStatusText.value = 'GPS Unavailable';
      setTimeout(() => {
        gpsStatusText.value = 'Use My GPS';
      }, 3000);
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    emit('submit-report', { ...form });
  } finally {
    isSubmitting.value = false;
  }
}
</script>