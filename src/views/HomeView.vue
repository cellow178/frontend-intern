<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import HeroSection from '@/components/home/HeroSection.vue'
import ProfileSection from '@/components/home/ProfileSection.vue'
import VisiMisiSection from '@/components/home/VisiMisiSection.vue'
import VideoSection from '@/components/home/VideoSection.vue'
import MajorSection from '@/components/home/MajorSection.vue'
import EventSection from '@/components/home/EventSection.vue'
import NewsSection from '@/components/home/NewsSection.vue'
import FeedbackSection from '@/components/home/FeedbackSection.vue'
import HomeSkeleton from '@/components/home/HomeSkeleton.vue'

const store = useSiteDataStore()

// Gunakan nama properti yang sesuai dengan yang ada di store (videoProfile dan majors)
const { isFullyLoaded, videoProfile, majors } = storeToRefs(store)

const isLoading = computed(() => !isFullyLoaded.value)

// Pengecekan apakah videoProfile ada (tidak null, undefined, atau string kosong)
const hasVideo = computed(() => {
  if (!videoProfile.value) return false
  if (typeof videoProfile.value === 'string') return !!videoProfile.value.trim()
  return !!videoProfile.value
})

// Pengecekan apakah data jurusan/majors ada (tidak null & array tidak kosong)
const hasMajors = computed(() => {
  if (!majors.value) return false
  if (Array.isArray(majors.value)) return majors.value.length > 0
  return true
})

onMounted(() => {
  store.fetchGlobalConfig()
  store.fetchMajors()
  store.fetchBanners()
  store.fetchVisionMission()
  store.fetchEvents()
  store.fetchNews()
})
</script>

<template>
  <HomeSkeleton v-if="isLoading" />

  <template v-else>
    <HeroSection />
    <ProfileSection />
    <VisiMisiSection />

    <!-- Hanya tampil jika data video profile tersedia -->
    <VideoSection v-if="hasVideo" />

    <!-- Hanya tampil jika data jurusan/majors tersedia -->
    <MajorSection v-if="hasMajors" />

    <EventSection />
    <NewsSection />
    <FeedbackSection />
  </template>
</template>
