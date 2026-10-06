<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'

const store = useSiteDataStore()
const { videoProfile, mapEmbed } = storeToRefs(store)

// 1. Ekstrak Video ID YouTube untuk Iframe
const embedUrl = computed(() => {
  if (!videoProfile.value) return ''

  const match = videoProfile.value.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  )
  const videoId = match ? match[1] : null

  return videoId ? `https://www.youtube.com/embed/${videoId}` : videoProfile.value
})

// 2. Ekstrak URL Src dari Iframe Google Maps (Rekomendasi agar aman & responsif)
const mapUrl = computed(() => {
  if (!mapEmbed.value) return ''

  const match = mapEmbed.value.match(/src=["']([^"']+)["']/)
  return match ? match[1] : ''
})
</script>

<template>
  <section
    id="video-lokasi"
    class="px-6 md:px-12 py-16 flex flex-col items-center gap-20 scroll-m-20 max-w-6xl mx-auto"
  >
    <!-- Section Video Profil -->
    <div
      v-if="embedUrl"
      class="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-100"
    >
      <iframe
        :src="embedUrl"
        class="w-full h-full"
        title="Video Profil Sekolah"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
          web-share;
        "
        allowfullscreen
      ></iframe>
    </div>

    <!-- Section Maps Embed -->
    <div
      v-if="mapUrl"
      class="w-full max-w-4xl aspect-video md:aspect-21/9 rounded-2xl overflow-hidden shadow-lg border border-gray-100"
    >
      <iframe
        :src="mapUrl"
        class="w-full h-full"
        title="Peta Lokasi Sekolah"
        style="border: 0"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  </section>
</template>
