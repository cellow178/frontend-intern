<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'

const route = useRoute()

const showLayout = computed(() => route.meta.hasLayout !== false)
const isTransparentNavbar = computed(() => route.meta.transparentNavbar === true)
</script>

<template>
  <Navbar v-if="showLayout" :transparent="isTransparentNavbar" />
  <RouterView />
  <Footer v-if="showLayout" />
</template>
