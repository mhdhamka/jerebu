<template>
  <div class="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto select-none">
    <div class="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900 leading-tight">Share Air Quality Status</h2>
              <span class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">Image Preview</span>
            </div>
            <p class="text-xs text-slate-500">
              {{ report?.areaName || 'Local Region' }} • {{ report?.estimatedAqi || 100 }} AQI ({{ report?.intensityLabel || 'Unhealthy' }})
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close modal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        
        <!-- Live Generated Image Preview Box -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>🖼️ Generated Air Quality Status Card</span>
            </span>
            <span v-if="isGenerating" class="text-orange-600 flex items-center gap-1 text-[11px] font-medium">
              <span class="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
              Generating HD graphic...
            </span>
            <span v-else class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200">
              ✓ Ready to Share (1200x675 HD)
            </span>
          </div>

          <!-- Image Container with loading state -->
          <div class="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 aspect-[16/9] flex items-center justify-center group">
            <div v-if="isGenerating" class="flex flex-col items-center gap-3 text-slate-400">
              <div class="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs font-medium">Rendering air quality metrics onto canvas...</p>
            </div>
            <img
              v-else-if="imageResult?.dataUrl"
              :src="imageResult.dataUrl"
              :alt="`Air quality status for ${report?.areaName}`"
              class="w-full h-full object-contain"
            />
            <div v-else class="text-xs text-rose-500">
              Failed to generate image preview. Please try again.
            </div>

            <!-- Quick Overlay Actions -->
            <div
              v-if="imageResult?.dataUrl && !isGenerating"
              class="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
            >
              <button
                type="button"
                @click="downloadImage"
                class="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                @click="copyImageToClipboard"
                class="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                </svg>
                <span>Copy Image</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Notification / Toast Feedback -->
        <div
          v-if="toastMessage"
          class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in"
        >
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{{ toastMessage }}</span>
          </div>
          <button @click="toastMessage = ''" class="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>

        <!-- Primary Action: Native Social Share Button -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Native Social Sharing</span>
            <span
              v-if="hasNativeShareSupport"
              class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"
            >
              Native Device Share API Supported
            </span>
          </div>

          <!-- Main High-Impact Share Button -->
          <button
            type="button"
            @click="triggerNativeShare"
            :disabled="isGenerating"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
          >
            <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
              </svg>
            </div>
            <span>Share Image via Device App (WhatsApp, IG, X, AirDrop)</span>
          </button>

          <!-- Secondary Quick Channels Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <!-- WhatsApp -->
            <a
              :href="whatsappShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>

            <!-- X / Twitter -->
            <a
              :href="twitterShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span>X (Twitter)</span>
            </a>

            <!-- Telegram -->
            <a
              :href="telegramShareUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>✈️</span>
              <span>Telegram</span>
            </a>

            <!-- Download PNG -->
            <button
              type="button"
              @click="downloadImage"
              class="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
            >
              <span>⬇️</span>
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        <!-- Share Text Preview -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accompanying Status Message
            </label>
            <button
              type="button"
              @click="copyShareText"
              class="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Copy Text
            </button>
          </div>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono leading-relaxed">
            {{ shareText }}
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span class="text-[11px]">Empowered by Jerebu-Watch Ground Truth Verification</span>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
  return `⚠️ Jerebu Alert in ${area}: Estimated AQI is ${aqi} (${intensity}). Visibility: ${vis}, Odor: ${smell}. Reported via Jerebu-Watch #JerebuWatch #AirQuality`;
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

  // Make sure image is generated
  if (!imageResult.value) {
    await createGraphic();
  }

  const shareData = {
    title: `Air Quality Alert: ${props.report.areaName} (${props.report.estimatedAqi} AQI)`,
    text: shareText.value,
    url: window.location.href
  };

  // Check if navigator.share supports file sharing
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
        return; // User canceled the share sheet
      }
    }
  }

  // Fallback to text/URL share if files not supported or failed
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
    // If browser doesn't have Web Share API, download the image and copy text
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
  showToast('Image downloaded! You can now post it to social media.');
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

  // Fallback to copying text
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
