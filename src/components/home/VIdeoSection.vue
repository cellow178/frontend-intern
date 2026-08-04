<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted, computed } from 'vue'

const rawVideoUrl = ref('')

const embedUrl = computed(() => {
  if (!rawVideoUrl.value) return ''

  // ambil video ID dari berbagai format link YouTube
  const match = rawVideoUrl.value.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  )
  const videoId = match ? match[1] : null

  return videoId ? `https://www.youtube.com/embed/${videoId}` : rawVideoUrl.value
})

const fetchVideo = async () => {
  try {
    const response = await api.get('/no-auth/global-config')
    rawVideoUrl.value = response.data.data.video_profile
  } catch (err) {
    console.error('Gagal ambil data video:', err)
  }
}

onMounted(() => {
  fetchVideo()
})
</script>

<template>
  <section class="px-12 py-16 flex flex-col items-center gap-8">
    <div
      v-if="embedUrl"
      class="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-lg"
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