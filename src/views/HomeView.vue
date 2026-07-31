<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
import ApiTest from '@/components/ApiTest.vue'
import Footer from '@/components/layout/Footer.vue';
</script>

<template>
  <Navbar :transparent="true" />
  <ApiTest />
  <Footer />
</template>