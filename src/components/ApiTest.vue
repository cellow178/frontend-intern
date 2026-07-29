<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import api from '@/services/api'

    const data = ref<any>(null)
    const error = ref<string | null>(null)
    const loading = ref(true)

    onMounted(async () => {
        try {
            const response = await api.get('/no-auth/majors') // ganti '/majors' dengan endpoint API-mu
            data.value = response.data
        } catch (err: any) {
            error.value = err.message || 'Gagal ambil data'
        } finally {
            loading.value = false
        }
    })
</script>

<template>
    <div>
        <h2>Tes Koneksi API</h2>

        <p v-if="loading">Loading...</p>
        <p v-else-if="error" style="color: red">Error: {{ error }}</p>
        <pre v-else>{{ JSON.stringify(data, null, 2) }}</pre>
        
        <h1 class="text-3xl font-bold text-blue-600">Tailwind aktif</h1>
    </div>
</template>
