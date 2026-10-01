<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getFullFileUrl, type FileSource } from '@/utils/file'

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

// Auto Slide Controller
const startTimer = () => {
  stopTimer()
  if (props.galleries && props.galleries.length > 1) {
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
      class="relative w-full h-56 sm:h-72 md:h-96 lg:h-105 rounded-xl sm:rounded-2xl overflow-hidden bg-text-alt/10 flex items-center justify-center"
    >
      <!-- Gambar Galeri Aktif -->
      <img
        v-if="activeImageUrl && !hasError"
        :src="activeImageUrl"
        :alt="activeGallery?.description || 'Galeri Jurusan'"
        class="w-full h-full object-cover transition-all duration-500 ease-in-out"
        @error="hasError = true"
      />

      <!-- Fallback jika Gambar Error/Kosong -->
      <div v-else class="flex flex-col items-center justify-center text-text-alt p-4 text-center">
        <i class="ri-image-line text-4xl sm:text-5xl mb-2"></i>
        <span class="text-xs font-medium">Gambar galeri tidak tersedia</span>
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
    <div class="flex items-center justify-between gap-3 mt-3 sm:mt-4 px-1">
      <!-- Badge / Logo & Kode Jurusan -->
      <div class="flex items-center space-x-2 sm:space-x-2.5">
        <img
          v-if="logoUrl && !logoError"
          :src="logoUrl"
          :alt="code || 'Logo Jurusan'"
          class="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full"
          @error="logoError = true"
        />
        <span v-else class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-primary inline-block"></span>

        <span
          class="font-black text-text-neutral text-base sm:text-lg md:text-xl tracking-wider uppercase"
        >
          {{ code }}
        </span>
      </div>

      <!-- Tombol Navigasi Teks Bawah -->
      <div v-if="galleries.length > 1" class="flex items-center space-x-2">
        <button
          @click="
            () => {
              prevImage()
              resetTimer()
            }
          "
          class="px-3 sm:px-4 py-1.5 sm:py-2 border border-secondary rounded-xl text-xs sm:text-sm font-semibold text-text-neutral hover:bg-secondary/60 active:scale-95 transition flex items-center gap-1"
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
          class="px-3 sm:px-4 py-1.5 sm:py-2 border border-secondary rounded-xl text-xs sm:text-sm font-semibold text-text-neutral hover:bg-secondary/60 active:scale-95 transition flex items-center gap-1"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  </div>
</template>
