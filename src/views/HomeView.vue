<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
import ApiTest from '@/components/ApiTest.vue'
import HeroSection from '@/components/home/HeroSection.vue';
import Footer from '@/components/layout/Footer.vue';
</script>

<template>
  <Navbar :transparent="true" />
  <HeroSection />
  <ApiTest />
  <section id="profil">Profil</section>
  <Footer />
</template>