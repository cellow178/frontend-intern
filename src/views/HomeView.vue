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
import VotingSection from '@/components/home/VotingSection.vue'
import NewsSection from '@/components/home/NewsSection.vue'
import FeedbackSection from '@/components/home/FeedbackSection.vue'
import HomeSkeleton from '@/components/home/HomeSkeleton.vue'

const store = useSiteDataStore()
const { isFullyLoaded } = storeToRefs(store)

const isLoading = computed(() => !isFullyLoaded.value)

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
    <VideoSection />
    <MajorSection />
    <EventSection />
    <NewsSection />
    <VotingSection />
    <FeedbackSection />
  </template>
</template>
