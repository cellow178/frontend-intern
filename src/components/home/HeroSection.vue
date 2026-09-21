<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { getFullFileUrl } from '@/utils/file'
import { RiArrowRightUpLine, RiSchoolFill } from '@remixicon/vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const store = useSiteDataStore()
const { banners, schoolName, motto, heroDescription } = storeToRefs(store)

const authStore = useAuthStore()
const isAuthenticated = computed(() => !!authStore.token)

const toastStore = useToastStore()
const handleVotingCenter = () => {
  if (!isAuthenticated.value) {
    toastStore.show('Silakan login terlebih dahulu untuk mengakses Voting', 'info')
    router.push('/login')
    return
  }
  router.push('/voting')
}

const getBannerImage = (banner: (typeof banners.value)[number]) => {
  if (!banner?.img_cover?.url) return ''
  return getFullFileUrl(banner.img_cover.url) || ''
}

const currentIndex = ref(0)
const isFirstImageReady = ref(false) // baru render section setelah gambar pertama siap
let intervalId: ReturnType<typeof setInterval> | undefined

const currentBanner = computed(() => banners.value[currentIndex.value] ?? null)

const nextImage = () => {
  if (banners.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % banners.value.length
}

const startAutoRotate = () => {
  stopAutoRotate()
  if (banners.value.length > 1) {
    intervalId = setInterval(nextImage, 5000)
  }
}

const stopAutoRotate = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = undefined
  }
}

const goToBanner = (index: number) => {
  currentIndex.value = index
  startAutoRotate()
}

// Preload gambar via elemen Image() browser, baru tandai siap setelah benar-benar ter-load
const preloadImage = (url: string) => {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // tetap lanjut walau gagal, jangan macet selamanya
    img.src = url
  })
}

watch(
  () => banners.value.length,
  async (newLen) => {
    if (newLen > 0) {
      currentIndex.value = 0
      const firstBanner = banners.value[0]
      const firstImageUrl = firstBanner ? getBannerImage(firstBanner) : ''

      if (firstImageUrl) {
        await preloadImage(firstImageUrl)
      }

      isFirstImageReady.value = true
      startAutoRotate()
    }
  },
  { immediate: true },
)

const handleBannerClick = () => {
  if (currentBanner.value?.url) {
    window.open(currentBanner.value.url, '_blank', 'noopener,noreferrer')
  }
}

const scrollToSection = (href: string) => {
  const target = document.querySelector(href)
  target?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  store.fetchBanners()
  store.fetchGlobalConfig()
})

onUnmounted(() => {
  stopAutoRotate()
})
</script>

<template>
  <section
    id="beranda"
    class="relative h-screen w-full overflow-hidden transition-colors duration-300"
    :class="isFirstImageReady ? '' : 'bg-secondary'"
  >
    <transition name="banner-fade">
      <div
        v-if="isFirstImageReady && currentBanner && getBannerImage(currentBanner)"
        :key="currentBanner.id"
        class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        :style="{
          backgroundImage: `url('${getBannerImage(currentBanner)}')`,
        }"
      ></div>
    </transition>

    <div class="absolute inset-0 bg-black/60 z-1"></div>

    <button
      v-if="currentBanner?.url"
      type="button"
      class="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-primary backdrop-blur-sm text-neutral text-xs font-medium px-3 py-2 rounded-full hover:opacity-80 transition-colors sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-12 cursor-pointer"
      @click="handleBannerClick"
    >
      <RiArrowRightUpLine class="w-5" />
    </button>

    <div
      v-if="banners.length > 1"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:bottom-8 lg:bottom-10"
    >
      <button
        v-for="(banner, idx) in banners"
        :key="banner.id"
        type="button"
        :aria-label="`Ke banner ${idx + 1}`"
        class="h-2.5 rounded-full transition-all cursor-pointer"
        :class="idx === currentIndex ? 'w-8 bg-neutral' : 'w-2.5 bg-neutral/40 hover:bg-neutral/60'"
        @click="goToBanner(idx)"
      ></button>
    </div>

    <div
      class="relative h-full flex flex-col justify-center px-6 pb-16 max-w-3xl mx-auto sm:px-8 sm:pb-20 lg:items-start lg:text-left lg:px-12 lg:pb-24 lg:mx-0 z-20"
    >
      <div class="flex items-center gap-2 text-primary font-bold text-base mb-2 sm:text-lg">
        <RiSchoolFill class="w-5 h-5 shrink-0 sm:w-6 sm:h-6" />
        <span>{{ motto }}</span>
      </div>

      <h1 class="text-neutral font-extrabold text-3xl mb-3 sm:text-5xl sm:mb-4 lg:text-6xl">
        {{ schoolName }}
      </h1>

      <p class="text-neutral text-base mb-6 sm:text-xl sm:mb-7 lg:text-2xl lg:mb-8">
        {{ heroDescription }}
      </p>

      <div
        class="flex flex-col items-stretch gap-3 w-full sm:flex-row sm:items-center sm:gap-4 lg:w-auto lg:justify-start"
      >
        <Button
          label="Video Profil"
          class="w-full justify-center sm:flex-1 lg:w-auto lg:flex-none"
          @click="scrollToSection('#video-profil')"
        />
        <Button
          label="Pusat Voting"
          variant="neutral"
          :icon-right="RiArrowRightUpLine"
          class="w-full justify-center sm:flex-1 lg:w-auto lg:flex-none"
          @click="handleVotingCenter"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 1s ease-in-out;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}

.banner-fade-enter-to,
.banner-fade-leave-from {
  opacity: 1;
}
</style>
