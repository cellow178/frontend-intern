<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'
import {
  RiCloseLine,
  RiZoomInLine,
  RiImageLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from '@remixicon/vue'

export interface GalleryItem {
  id?: number | string
  description?: string
  img_cover?: FileSource
}

const props = withDefaults(
  defineProps<{
    galleries?: GalleryItem[]
    code?: string
    logo?: FileSource | string | null
    autoSlideInterval?: number // Durasi pindah gambar (milidetik)
  }>(),
  {
    galleries: () => [],
    code: '',
    logo: null,
    autoSlideInterval: 5000,
  },
)

const currentIndex = ref(0)
const hasError = ref(false)
const logoError = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

// URL Logo Jurusan
const logoUrl = computed(() => {
  if (!props.logo) return null
  return typeof props.logo === 'string' ? props.logo : getFullFileUrl(props.logo)
})

// Objek galeri yang sedang aktif
const activeGallery = computed(() => {
  if (!props.galleries || props.galleries.length === 0) return null
  return props.galleries[currentIndex.value]
})

// Ekstrak URL Gambar via Helper getFullFileUrl
const activeImageUrl = computed(() => {
  if (!activeGallery.value) return null
  return getFullFileUrl(activeGallery.value.img_cover)
})

// Reset error state saat gambar berpindah
watch(currentIndex, () => {
  hasError.value = false
})

// Navigation Handlers
const prevImage = () => {
  if (props.galleries.length === 0) return
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.galleries.length - 1
  }
}

const nextImage = () => {
  if (props.galleries.length === 0) return
  if (currentIndex.value < props.galleries.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

const selectImage = (index: number) => {
  currentIndex.value = index
  resetTimer()
}

const lightboxOpen = ref(false)

const openLightbox = () => {
  if (!activeImageUrl.value || hasError.value) return
  lightboxOpen.value = true
  stopTimer()
}

const closeLightbox = () => {
  lightboxOpen.value = false
  startTimer()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!lightboxOpen.value) return

  if (event.key === 'Escape') {
    closeLightbox()
  } else if (event.key === 'ArrowLeft' && props.galleries.length > 1) {
    event.preventDefault()
    prevImage()
  } else if (event.key === 'ArrowRight' && props.galleries.length > 1) {
    event.preventDefault()
    nextImage()
  }
}

// Auto Slide Controller
const startTimer = () => {
  stopTimer()

  if (!lightboxOpen.value && props.galleries.length > 1) {
    timer = setInterval(() => {
      nextImage()
    }, props.autoSlideInterval)
  }
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const resetTimer = () => {
  stopTimer()
  startTimer()
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

watch(
  () => props.galleries,
  () => {
    currentIndex.value = 0
    startTimer()
  },
  { deep: true },
)
</script>

<template>
  <div
    v-if="galleries && galleries.length > 0"
    class="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-sm border border-secondary/50 max-w-4xl mx-auto"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
  >
    <!-- 1. CONTAINER GAMBAR UTAMA -->
    <div
      class="relative w-full aspect-4/3 sm:aspect-auto sm:h-60 md:h-96 lg:h-80 xl:h-110 mx-auto rounded-xl sm:rounded-2xl overflow-hidden bg-text-alt/10 flex items-center justify-center"
    >
      <button
        v-if="activeImageUrl && !hasError"
        type="button"
        @click="openLightbox"
        :aria-label="`Perbesar gambar ${activeGallery?.description || 'Galeri Jurusan'}`"
        class="block w-full h-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <img
          :src="activeImageUrl"
          :alt="activeGallery?.description || 'Galeri Jurusan'"
          class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          @error="hasError = true"
        />

        <!-- Petunjuk gambar dapat diperbesar -->
        <span
          class="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm"
        >
          <RiZoomInLine />
        </span>
      </button>

      <!-- Fallback jika gambar error atau kosong -->
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center text-text-alt p-4 text-center"
      >
        <RiImageLine />
        <span class="text-xs font-medium"> Gambar galeri tidak tersedia </span>
      </div>
    </div>

    <!-- 2. DESKRIPSI GAMBAR DI LUAR GAMBAR -->
    <div
      v-if="activeGallery?.description"
      class="mt-3 sm:mt-4 text-center px-2 min-h-10 flex items-center justify-center"
    >
      <p class="text-xs sm:text-sm md:text-base font-medium text-text-neutral leading-relaxed">
        {{ activeGallery.description }}
      </p>
    </div>

    <!-- 3. DOT NAVIGATION (INDIKATOR GAMBAR) -->
    <div
      v-if="galleries.length > 1"
      class="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4"
    >
      <button
        v-for="(_, index) in galleries"
        :key="index"
        @click="selectImage(index)"
        :aria-label="`Pergi ke gambar ${index + 1}`"
        class="h-2 sm:h-2.5 rounded-full transition-all duration-300 focus:outline-none"
        :class="[
          currentIndex === index
            ? 'w-6 sm:w-8 bg-primary'
            : 'w-2 sm:w-2.5 bg-text-alt/20 hover:bg-primary/50',
        ]"
      ></button>
    </div>

    <!-- 4. FOOTER CONTROL & LOGO/KODE JURUSAN -->
    <div
      class="flex flex-col gap-3 mt-4 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <!-- Logo & Kode Jurusan -->
      <div class="flex items-center gap-2 min-w-0">
        <img
          v-if="logoUrl && !logoError"
          :src="logoUrl"
          :alt="code || 'Logo Jurusan'"
          class="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full shrink-0"
          @error="logoError = true"
        />
        <span
          v-else
          class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-primary inline-block shrink-0"
        ></span>

        <span
          class="font-black text-text-neutral text-base sm:text-lg md:text-xl tracking-wider uppercase truncate"
        >
          {{ code }}
        </span>
      </div>

      <!-- Tombol Navigasi -->
      <div
        v-if="galleries.length > 1"
        class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center"
      >
        <button
          @click="
            () => {
              prevImage()
              resetTimer()
            }
          "
          class="w-full sm:w-auto px-3 sm:px-4 py-2 border border-secondary rounded-xl text-xs sm:text-sm font-semibold text-text-neutral hover:bg-secondary/60 active:scale-95 transition whitespace-nowrap"
        >
          Sebelumnya
        </button>

        <button
          @click="
            () => {
              nextImage()
              resetTimer()
            }
          "
          class="w-full sm:w-auto px-3 sm:px-4 py-2 border border-secondary rounded-xl text-xs sm:text-sm font-semibold text-text-neutral hover:bg-secondary/60 active:scale-95 transition whitespace-nowrap"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  </div>

  <!-- 5. FULLSCREEN LIGHTBOX -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="lightboxOpen && activeImageUrl && !hasError"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="activeGallery?.description || 'Galeri Jurusan'"
        @click.self="closeLightbox"
      >
        <!-- Tombol tutup -->
        <button
          type="button"
          @click="closeLightbox"
          aria-label="Tutup gambar"
          class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RiCloseLine />
        </button>

        <!-- Nomor gambar -->
        <div
          v-if="galleries.length > 1"
          class="absolute top-5 left-4 sm:top-7 sm:left-7 z-20 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
        >
          {{ currentIndex + 1 }} / {{ galleries.length }}
        </div>

        <!-- Tombol gambar sebelumnya -->
        <button
          v-if="galleries.length > 1"
          type="button"
          @click.stop="prevImage"
          aria-label="Gambar sebelumnya"
          class="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RiArrowLeftSLine />
        </button>

        <!-- Gambar utuh -->
        <figure
          class="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-4 px-8 sm:px-16 py-14"
          @click.stop
        >
          <img
            :key="activeImageUrl"
            :src="activeImageUrl"
            :alt="activeGallery?.description || 'Galeri Jurusan'"
            class="max-h-full max-w-full object-contain"
          />

          <figcaption
            v-if="activeGallery?.description"
            class="max-w-3xl text-center text-sm sm:text-base text-white/90"
          >
            {{ activeGallery.description }}
          </figcaption>
        </figure>

        <!-- Tombol gambar selanjutnya -->
        <button
          v-if="galleries.length > 1"
          type="button"
          @click.stop="nextImage"
          aria-label="Gambar selanjutnya"
          class="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RiArrowRightSLine />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
