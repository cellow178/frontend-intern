<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

interface MissionDetail {
  id: number
  content: string
  order: number
  active: boolean
  created_at: string
  updated_at: string
}

const route = useRoute()
const toastStore = useToastStore()

const mission = ref<MissionDetail | null>(null)
const isLoading = ref(true)

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.')

  return `${formattedDate} • ${formattedTime} WIB`
}

const fetchDetail = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/missions/${route.params.id}`)
    mission.value = response.data.data
  } catch (err) {
    console.error('Gagal mengambil detail misi:', err)
    toastStore.show('Gagal memuat detail data.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <BackButton to="/dashboard/visi-misi" :sticky="false" />

      <div class="border-t border-text-alt/50 mt-2 mb-6"></div>

      <h1 class="text-xl font-bold text-text-neutral mb-4">Detail Misi</h1>

      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat data..." />
      </div>

      <div v-else-if="!mission" class="text-center text-text-alt py-8">Data tidak ditemukan.</div>

      <dl v-else class="flex flex-col">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Urutan (Order)</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">{{ mission.order }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Isi Misi</dt>
          <dd class="sm:col-span-2 text-text-neutral leading-relaxed">{{ mission.content }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Status</dt>
          <dd class="sm:col-span-2 flex items-center gap-2">
            <DashboardStatusBadge :active="mission.active" />
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(mission.created_at) }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDate(mission.updated_at) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
