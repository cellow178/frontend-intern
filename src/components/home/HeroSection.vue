<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { RiArrowRightUpLine, RiSchoolFill } from '@remixicon/vue'
import Button from '@/components/ui/Button.vue'

const store = useSiteDataStore()
const { banners, schoolName, motto, heroDescription } = storeToRefs(store)

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

    <!-- Overlay gelap biar teks kebaca -->
    <div class="absolute inset-0 bg-black/50"></div>

    <!-- Konten -->
    <div class="relative h-full flex flex-col justify-center px-12 pb-24 max-w-3xl">
      <div class="flex items-center gap-2 text-primary font-bold text-lg mb-2">
        <RiSchoolFill class="w-6 h-6" />
        <span>{{ motto }}</span>
      </div>

      <h1 class="text-neutral font-extrabold text-6xl mb-4">
        {{ schoolName }}
      </h1>

      <p class="text-neutral text-2xl mb-8">
        {{ heroDescription }}
      </p>

      <div class="flex items-center gap-4">
        <Button label="Selengkapnya" @click="scrollToSection('#profil')" />
        <Button
          label="Kompetensi Keahlian"
          variant="neutral"
          :icon-right="RiArrowRightUpLine"
          @click="scrollToSection('#kompetensi')"
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
