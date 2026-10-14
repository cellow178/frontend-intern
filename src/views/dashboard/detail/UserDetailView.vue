<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

interface UserDetail {
  id: number
  fullname: string
  username: string
  email: string | null
  nisn: string | null
  angkatan: string | null
  role_id: number
  rel_role_id: string | null
  status_code: string
  must_change_password: boolean
  email_verified_at: string | null
  last_login_at: string | null
  rel_created_by?: string | null
  rel_updated_by?: string | null
  created_at: string | null
  updated_at: string | null
}

const route = useRoute()
const toastStore = useToastStore()

const user = ref<UserDetail | null>(null)
const isLoading = ref(true)

const statusMeta = (code: string) => {
  const map: Record<string, { label: string; classes: string }> = {
    user_active: { label: 'Aktif', classes: 'bg-success/15 text-success' },
    user_nonactive: { label: 'Nonaktif', classes: 'bg-error/15 text-error' },
    user_rejected: { label: 'Ditolak', classes: 'bg-error/15 text-error' },
    email_unverified: { label: 'Belum Verifikasi', classes: 'bg-warning/15 text-warning' },
    email_verified: { label: 'Terverifikasi', classes: 'bg-info/15 text-info' },
  }
  return map[code] ?? { label: code || '-', classes: 'bg-secondary/40 text-text-alt' }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
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
    const response = await api.get(`/users/${route.params.id}`)
    user.value = response.data.data
  } catch (err) {
    console.error('Gagal mengambil detail pengguna:', err)
    toastStore.show('Gagal memuat Detail Pengguna.', 'error')
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
          <BackButton to="/dashboard/daftar-pengguna" :sticky="false" />
        </span>

        <div class="border-t border-text-alt/50"></div>

        <h1 class="text-xl lg:text-2xl font-bold text-text-neutral">Detail Pengguna</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Memuat detail..." />
      </div>

      <!-- Empty State -->
      <div v-else-if="!user" class="text-center text-text-alt py-10 text-sm sm:text-base">
        Data pengguna tidak ditemukan.
      </div>

      <!-- Detail -->
      <dl v-else class="flex flex-col mt-4 lg:mt-6">
        <!-- Nama Lengkap -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Nama Lengkap</dt>
          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ user.fullname || '-' }}
          </dd>
        </div>

        <!-- Username -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Username</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.username || '-' }}
          </dd>
        </div>

        <!-- Email -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Email</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.email || '-' }}
          </dd>
        </div>

        <!-- NISN -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">NISN</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.nisn || '-' }}
          </dd>
        </div>

        <!-- Angkatan -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Angkatan</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.angkatan || '-' }}
          </dd>
        </div>

        <!-- Role -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Role</dt>
          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ user.rel_role_id || '-' }}
          </dd>
        </div>

        <!-- Status -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Status</dt>
          <dd class="sm:col-span-2 flex items-center">
            <span
              class="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold"
              :class="statusMeta(user.status_code).classes"
            >
              {{ statusMeta(user.status_code).label }}
            </span>
          </dd>
        </div>

        <!-- Wajib Ganti Password -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">
            Wajib Ganti Password
          </dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.must_change_password ? 'Ya' : 'Tidak' }}
          </dd>
        </div>

        <!-- Login Terakhir -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Login Terakhir</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(user.last_login_at) }}
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
            {{ user.rel_created_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Dibuat -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Dibuat</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(user.created_at) }}
          </dd>
        </div>

        <!-- Diubah Oleh -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Diubah Terakhir Oleh</dt>
          <dd
            class="sm:col-span-2 text-sm lg:text-base text-text-neutral font-medium wrap-break-word"
          >
            {{ user.rel_updated_by || '-' }}
          </dd>
        </div>

        <!-- Tanggal Diubah -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5">
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tanggal Diubah</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ formatDate(user.updated_at) }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
