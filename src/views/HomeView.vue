<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import ProfileSection from '@/components/home/ProfileSection.vue'
import VisiMisiSection from '@/components/home/VisiMisiSection.vue'
import VIdeoSection from '@/components/home/VIdeoSection.vue'
import MajorSection from '@/components/home/MajorSection.vue'
import EventSetion from '@/components/home/EventSetion.vue'
import NewsSection from '@/components/home/NewsSection.vue'
import Footer from '@/components/layout/Footer.vue'
</script>

<template>
  <Navbar :transparent="true" />
  <HeroSection />
  <ProfileSection />
  <VisiMisiSection />
  <VIdeoSection />
  <MajorSection />
  <EventSetion />
  <NewsSection />
  <Footer />
</template>
