<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="text-text-alt">
    Halaman <strong>{{ route.name }}</strong> belum dibuat.
  </div>
</template>
