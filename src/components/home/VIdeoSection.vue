<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'

const store = useSiteDataStore()
const { videoProfile } = storeToRefs(store)

const embedUrl = computed(() => {
  if (!videoProfile.value) return ''

  // ambil video ID dari berbagai format link YouTube
  const match = videoProfile.value.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  )
  const videoId = match ? match[1] : null

  return videoId ? `https://www.youtube.com/embed/${videoId}` : videoProfile.value
})

onMounted(() => {
  store.fetchGlobalConfig()
})
</script>

<template>
  <section class="px-12 py-16 flex flex-col items-center gap-8">
    <div
      v-if="embedUrl"
      class="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-lg"
    >
      <iframe
        :src="embedUrl"
        class="w-full h-full"
        title="Video Profil Sekolah"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  </section>
</template>
