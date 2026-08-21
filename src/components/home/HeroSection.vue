<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
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

const currentIndex = ref(0)
let intervalId: ReturnType<typeof setInterval> | undefined

const currentBanner = computed(() => banners.value[currentIndex.value])

const nextImage = () => {
  if (banners.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % banners.value.length
}

const scrollToSection = (href: string) => {
  const target = document.querySelector(href)
  target?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async () => {
  await store.fetchBanners()
  intervalId = setInterval(nextImage, 5000)
  store.fetchGlobalConfig()
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <section id="beranda" class="relative h-screen w-full overflow-hidden">
    <!-- Background image carousel -->
    <transition name="fade">
      <div
        v-if="currentBanner"
        :key="currentBanner.id"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${currentBanner.img_cover})` }"
      ></div>
    </transition>

    <!-- Overlay gelap -->
    <div class="absolute inset-0 bg-black/50"></div>

    <!-- Konten -->
    <div
      class="relative h-full flex flex-col justify-center px-6 pb-16 max-w-3xl mx-auto sm:px-8 sm:pb-20 lg:items-start lg:text-left lg:px-12 lg:pb-24 lg:mx-0"
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
