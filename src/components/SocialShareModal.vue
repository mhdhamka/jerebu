<template>
  <div class="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md overflow-y-auto select-none transition-all">
    <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Share Air Quality Status</h2>
              <span class="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-200/50 dark:border-orange-500/20">HD Preview</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ report?.areaName || 'Local Region' }} &bull; {{ report?.estimatedAqi || 100 }} AQI (<span class="font-semibold text-slate-700 dark:text-slate-300">{{ report?.intensityLabel || 'Unhealthy' }}</span>)
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close modal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
        
        <!-- Live Generated Image Preview Box -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Generated Status Graphic
            </span>
            <span v-if="isGenerating" class="text-orange-600 dark:text-orange-400 flex items-center gap-1.5 text-[11px] font-medium">
              <span class="w-3.5 h-3.5 border-2 border-orange-600 dark:border-orange-400 border-t-transparent rounded-full animate-spin"></span>
              Rendering canvas...
            </span>
            <span v-else class="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
              ✓ Ready for Socials (1200x675)
            </span>
          </div>

          <!-- Image Container with loading state -->
          <div class="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-inner bg-slate-950 aspect-[16/9] flex items-center justify-center group">
            <div v-if="isGenerating" class="flex flex-col items-center gap-3 text-slate-400">
              <div class="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs font-medium">Synthesizing meteorological snapshot...</p>
            </div>
            <img
              v-else-if="imageResult?.dataUrl"
              :src="imageResult.dataUrl"
              :alt="`Air quality status for ${report?.areaName}`"
              class="w-full h-full object-contain"
            />
            <div v-else class="text-xs text-rose-500 px-4 text-center">
              Failed to generate image preview. Please try again.
            </div>

            <!-- Quick Overlay Actions -->
            <div
              v-if="imageResult?.dataUrl && !isGenerating"
              class="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                @click="downloadImage"
                class="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
              >
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                @click="copyImageToClipboard"
                class="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
              >
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                </svg>
                <span>Copy Image</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Toast Feedback -->
        <div
          v-if="toastMessage"
          class="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm transition-all"
        >
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{{ toastMessage }}</span>
          </div>
          <button @click="toastMessage = ''" class="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200 px-1.5 py-0.5">✕</button>
        </div>

        <!-- Primary Native Share -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Direct Sharing</span>
            <span
              v-if="hasNativeShareSupport"
              class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/20"
            >
              Native Device Share Available
            </span>
          </div>

          <button
            type="button"
            @click="triggerNativeShare"
            :disabled="isGenerating"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 transition-all cursor-pointer hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
          >
            <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
              </svg>
            </div>
            <span>Share Image via Device Sheet (WhatsApp, Instagram, AirDrop)</span>
          </button>

          <!-- Secondary Quick Channels Grid (With Official Brand SVGs) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            
            <!-- WhatsApp -->
            <a
              :href="whatsappShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all text-center"
            >
              <svg class="w-4 h-4 fill-current text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.124-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            <!-- X / Twitter -->
            <a
              :href="twitterShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all text-center"
            >
              <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span>X (Twitter)</span>
            </a>

            <!-- Telegram -->
            <a
              :href="telegramShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/50 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all text-center"
            >
              <svg class="w-4 h-4 fill-current text-sky-600 dark:text-sky-400 shrink-0" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.943z"/>
              </svg>
              <span>Telegram</span>
            </a>

            <!-- Download PNG Button -->
            <button
              type="button"
              @click="downloadImage"
              class="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
            >
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        <!-- Share Text Preview -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Accompanying Status Text
            </label>
            <button
              type="button"
              @click="copyShareText"
              class="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 cursor-pointer"
            >
              Copy Text
            </button>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
            {{ shareText }}
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span class="text-[11px]">Jerebu Ground Truth Verification System</span>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { generateReportImage } from '../utils/reportImageGenerator.js';

const props = defineProps({
  report: { type: Object, required: true }
});

defineEmits(['close']);

const isGenerating = ref(true);
const imageResult = ref(null);
const toastMessage = ref('');

const hasNativeShareSupport = computed(() => {
  return typeof navigator !== 'undefined' && !!navigator.share;
});

const shareText = computed(() => {
  if (!props.report) return '';
  const area = props.report.areaName || 'Local Region';
  const aqi = props.report.estimatedAqi || 100;
  const intensity = props.report.intensityLabel || 'Unhealthy';
  const vis = props.report.visibilityLabel || '< 500m';
  const smell = props.report.smellLevel || 'Burning Odor';
  return `Jerebu Alert in ${area}: Estimated AQI is ${aqi} (${intensity}). Visibility: ${vis}, Odor: ${smell}. Reported via Jerebu #JerebuWatch #AirQuality`;
});

const whatsappShareUrl = computed(() => {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText.value + ' ' + window.location.href)}`;
});

const twitterShareUrl = computed(() => {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(window.location.href)}`;
});

const telegramShareUrl = computed(() => {
  return `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText.value)}`;
});

onMounted(() => {
  createGraphic();
});

watch(() => props.report, () => {
  createGraphic();
});

async function createGraphic() {
  if (!props.report) return;
  isGenerating.value = true;
  try {
    imageResult.value = await generateReportImage(props.report);
  } catch (err) {
    console.error('Error generating report share image:', err);
  } finally {
    isGenerating.value = false;
  }
}

async function triggerNativeShare() {
  if (!props.report) return;

  if (!imageResult.value) {
    await createGraphic();
  }

  const shareData = {
    title: `Air Quality Alert: ${props.report.areaName} (${props.report.estimatedAqi} AQI)`,
    text: shareText.value,
    url: window.location.href
  };

  if (navigator.share && imageResult.value?.file) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [imageResult.value.file] })) {
        await navigator.share({
          ...shareData,
          files: [imageResult.value.file]
        });
        showToast('Shared successfully with air quality image preview!');
        return;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('File share failed, falling back to text/link:', err);
      } else {
        return;
      }
    }
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('Shared successfully via device share sheet!');
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloadImage();
      }
    }
  } else {
    downloadImage();
    copyShareText();
    showToast('Image downloaded & share text copied to clipboard!');
  }
}

function downloadImage() {
  if (!imageResult.value?.dataUrl) return;
  const link = document.createElement('a');
  link.download = imageResult.value.fileName || 'jerebu-report.png';
  link.href = imageResult.value.dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Image downloaded successfully!');
}

async function copyImageToClipboard() {
  if (!imageResult.value?.blob) return;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': imageResult.value.blob });
      await navigator.clipboard.write([item]);
      showToast('Air quality preview image copied to clipboard!');
      return;
    }
  } catch (err) {
    console.warn('Clipboard image write not allowed:', err);
  }

  copyShareText();
}

async function copyShareText() {
  try {
    await navigator.clipboard.writeText(shareText.value);
    showToast('Report status text copied to clipboard!');
  } catch (err) {
    showToast('Could not access clipboard.');
  }
}

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 4500);
}
</script>