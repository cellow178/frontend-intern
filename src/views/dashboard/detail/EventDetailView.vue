<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import api from '@/services/api'
import { getFullFileUrl } from '@/utils/file'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import EnumStatusBadge from '@/components/ui/EnumStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'

interface EventImageCover {
  ext: string
  url: string
  tumbnail_url: string
  filename: string
  field_value: string
}

interface EventDetail {
  id: number
  slug: string
  title: string
  content: string
  location: string
  start_date: string
  end_date: string
  img_cover: EventImageCover | null
  status: string
  is_highlight: boolean
  rel_updated_by: string
  updated_at: string
  rel_created_by: string
  created_at: string
}

const route = useRoute()
const toastStore = useToastStore()

const event = ref<EventDetail | null>(null)
const isLoading = ref(true)

const coverUrl = computed(() => {
  if (!event.value?.img_cover) return null
  return getFullFileUrl(event.value.img_cover)
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const formatEventRange = (startDate?: string, endDate?: string) => {
  if (!startDate) return '-'
  if (!endDate || startDate === endDate) {
    return formatDate(startDate)
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

const formatDateTime = (dateStr: string) => {
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
    const response = await api.get(`/events/${route.params.id}`)
    event.value = response.data?.data ?? null
  } catch (err) {
    let errorMessage = 'Gagal memuat detail data event.'
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      errorMessage = err.response.data.message
    }
    toastStore.show(errorMessage, 'error')
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
    <!-- Kartu Metadata / Detail Data -->
    <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
      <BackButton to="/dashboard/event" :sticky="false" />

      <div class="border-t border-text-alt/50 mt-2 mb-6"></div>

      <h1 class="text-xl font-bold text-text-neutral mb-4">Detail Event</h1>

      <!-- State Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- State Data Tidak Ditemukan -->
      <div v-else-if="!event" class="text-center text-text-alt py-8">
        Data event tidak ditemukan.
      </div>

      <!-- Detail Data -->
      <dl v-else class="flex flex-col">
        <!-- Judul -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Judul Event</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium break-all">
            {{ event.title }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Lokasi -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Lokasi</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ event.location || '-' }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Tanggal Pelaksanaan -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Pelaksanaan</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ formatEventRange(event.start_date, event.end_date) }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Cover Event -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Cover Event</dt>
          <dd class="sm:col-span-2 text-text-neutral">
            <a
              v-if="coverUrl"
              :href="coverUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ coverUrl }}
            </a>
            <span v-else class="text-text-alt">-</span>
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Status</dt>
          <dd class="sm:col-span-2 flex items-center gap-2">
            <EnumStatusBadge :status="event.status" />
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Diubah Terakhir Oleh</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ event.rel_updated_by || '-' }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Tanggal Diubah -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDateTime(event.updated_at) }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 border-b border-secondary">
          <dt class="text-text-neutral font-semibold">Dibuat Oleh</dt>
          <dd class="sm:col-span-2 text-text-neutral font-medium">
            {{ event.rel_created_by || '-' }}
          </dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4">
          <dt class="text-text-neutral font-semibold">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-text-neutral">{{ formatDateTime(event.created_at) }}</dd>
        </div>

        <div class="border-t border-text-alt/10"></div>

        <div class="py-8">
          <h2 class="text-text-neutral font-semibold pb-3 mb-4 border-b border-text-alt/50">
            Deskripsi Event
          </h2>
          <RichTextContent :content="event.content" class="max-w-4xl" />
        </div>
      </dl>
    </div>
  </div>
</template>
