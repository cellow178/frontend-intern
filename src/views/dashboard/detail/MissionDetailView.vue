<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiFlagLine } from '@remixicon/vue'

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
    toastStore.show('Gagal memuat Detail Misi.', 'error')
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
    <div class="bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="flex flex-col gap-4">
        <span><BackButton to="/dashboard/visi-misi" :sticky="false" /></span>

        <div class="border-t border-text-alt/50"></div>
        <h1 class="flex items-center gap-2 text-xl lg:text-2xl font-bold text-text-neutral"><RiFlagLine class="w-6 h-6 text-primary shrink-0" />Detail Misi</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!mission" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Urutan -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Urutan (Order)</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ mission.order ?? '-' }}
          </dd>
        </div>

        <!-- Isi Misi -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Isi Misi</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral leading-relaxed wrap-break-word"
          >
            {{ mission.content || '-' }}
          </dd>
        </div>

        <!-- Status -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Status</dt>

          <dd class="sm:col-span-2 flex items-center">
            <DashboardStatusBadge :active="mission.active" />
          </dd>
        </div>

        <!-- Tanggal Diubah -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(mission.updated_at) }}
          </dd>
        </div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(mission.created_at) }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
