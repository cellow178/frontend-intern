<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
import HeroSection from '@/components/home/HeroSection.vue';
import ProfileSection from '@/components/home/ProfileSection.vue';
import Footer from '@/components/layout/Footer.vue';
</script>

<template>
  <Navbar :transparent="true" />
  <HeroSection />
  <ProfileSection />
  <Footer />
</template>