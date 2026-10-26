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
import { RiCalendarEventLine } from '@remixicon/vue'

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
  img_description?: string | null
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
    let errorMessage = 'Gagal memuat Detail Event.'
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
    <div class="bg-neutral rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="flex flex-col gap-4">
        <span><BackButton to="/dashboard/event" :sticky="false" /></span>

        <div class="border-t border-text-alt/50"></div>
        <h1 class="flex items-center gap-2 text-xl lg:text-2xl font-bold text-text-neutral"><RiCalendarEventLine class="w-6 h-6 text-primary shrink-0" />Detail Event</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!event" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data event tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Judul -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Judul Event</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ event.title || '-' }}
          </dd>
        </div>

        <!-- Lokasi -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Lokasi</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ event.location || '-' }}
          </dd>
        </div>

        <!-- Tanggal Pelaksanaan -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Pelaksanaan</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatEventRange(event.start_date, event.end_date) }}
          </dd>
        </div>

        <!-- Cover Event -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Cover Event</dt>

          <dd class="sm:col-span-2 min-w-0 text-sm lg:text-base text-text-neutral">
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

        <!-- Deskripsi Cover Event -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">
            Deskripsi Cover Event
          </dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ event.img_description || '-' }}
          </dd>
        </div>

        <!-- Status -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Status</dt>

          <dd class="sm:col-span-2 flex items-center">
            <EnumStatusBadge :status="event.status" />
          </dd>
        </div>

        <!-- Diubah Terakhir Oleh -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Diubah Terakhir Oleh</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ event.rel_updated_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Diubah -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDateTime(event.updated_at) }}
          </dd>
        </div>

        <!-- Dibuat Oleh -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Dibuat Oleh</dt>

          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ event.rel_created_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Dibuat -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>

          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDateTime(event.created_at) }}
          </dd>
        </div>

        <!-- Deskripsi Event -->
        <div class="py-6 lg:py-8 border-t border-text-alt/15">
          <h2
            class="text-sm lg:text-base font-semibold text-text-neutral pb-3 mb-4 border-b border-text-alt/20"
          >
            Konten Event
          </h2>

          <RichTextContent :content="event.content" class="max-w-4xl text-sm lg:text-base" />
        </div>
      </dl>
    </div>
  </div>
</template>
