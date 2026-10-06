<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import HeroSection from '@/components/home/HeroSection.vue'
import ProfileSection from '@/components/home/ProfileSection.vue'
import VisiMisiSection from '@/components/home/VisiMisiSection.vue'
import VideoLocationSection from '@/components/home/VideoLocationSection.vue'
import MajorSection from '@/components/home/MajorSection.vue'
import EventSection from '@/components/home/EventSection.vue'
import NewsSection from '@/components/home/NewsSection.vue'
import FeedbackSection from '@/components/home/FeedbackSection.vue'
import HomeSkeleton from '@/components/home/HomeSkeleton.vue'

const store = useSiteDataStore()

const { isFullyLoaded, videoProfile, mapEmbed, majors } = storeToRefs(store)

const isLoading = computed(() => !isFullyLoaded.value)

const hasVideoOrMap = computed(() => {
  const hasVideo =
    typeof videoProfile.value === 'string' ? !!videoProfile.value.trim() : !!videoProfile.value

  const hasMap = typeof mapEmbed.value === 'string' ? !!mapEmbed.value.trim() : !!mapEmbed.value

  return hasVideo || hasMap
})

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

    <VideoLocationSection v-if="hasVideoOrMap" />

    <MajorSection v-if="hasMajors" />

    <EventSection />
    <NewsSection />
    <FeedbackSection />
  </template>
</template>
