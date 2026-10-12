<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import FeedbackTypeBadge from '@/components/ui/FeedbackTypeBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

interface FeedbackDetail {
  id: number
  sender_name: string | null
  type: boolean
  message: string
  rel_category_id: string
  created_at: string
}

const route = useRoute()
const toastStore = useToastStore()

const feedback = ref<FeedbackDetail | null>(null)
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
    const response = await api.get(`/feedbacks/${route.params.id}`)
    feedback.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil detail feedback:', err)
    toastStore.show('Gagal memuat Detail Feedback.', 'error')
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
        <span>
          <BackButton to="/dashboard/kritik-saran" :sticky="false" />
        </span>

        <div class="border-t border-text-alt/50"></div>

        <h1 class="text-xl lg:text-2xl font-bold text-text-neutral">
          Detail{{ feedback ? ` ${feedback.type ? 'Saran' : 'Kritik'}` : ' Kritik & Saran' }}
        </h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!feedback" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data kritik dan saran tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Nama Pengirim -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Nama Pengirim</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ feedback.sender_name || 'Anonim' }}
          </dd>
        </div>

        <!-- Tipe -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tipe</dt>

          <dd class="sm:col-span-2 flex items-center">
            <FeedbackTypeBadge :type="feedback.type" />
          </dd>
        </div>

        <!-- Kategori -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Kategori</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ feedback.rel_category_id || '-' }}
          </dd>
        </div>

        <!-- Tanggal -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(feedback.created_at) }}
          </dd>
        </div>

        <!-- Pesan -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Pesan</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral whitespace-pre-wrap wrap-break-word"
          >
            {{ feedback.message }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
