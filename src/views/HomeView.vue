<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import ProfileSection from '@/components/home/ProfileSection.vue'
import VisiMisiSection from '@/components/home/VisiMisiSection.vue'
import VideoSection from '@/components/home/VideoSection.vue'
import MajorSection from '@/components/home/MajorSection.vue'
import EventSection from '@/components/home/EventSection.vue'
import VotingSection from '@/components/home/VotingSection.vue'
import NewsSection from '@/components/home/NewsSection.vue'
import Footer from '@/components/layout/Footer.vue'
import FeedbackSection from '@/components/home/FeedbackSection.vue'
</script>

<template>
  <Navbar :transparent="true" />
  <HeroSection />
  <ProfileSection />
  <VisiMisiSection />
  <VideoSection />
  <MajorSection />
  <EventSection />
  <NewsSection />
  <VotingSection />
  <FeedbackSection />
  <Footer />
</template>
