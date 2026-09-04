<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/layout/Layout.vue'
import Toast from '@/components/ui/ToastContainer.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.fetchUser()
})
</script>

<template>
  <Layout />
  <Toast />
</template>
