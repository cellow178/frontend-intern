<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import BackButton from '@/components/ui/BackButton.vue'
import DashboardStatusBadge from '@/components/ui/DashboardStatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiUserSettingsLine } from '@remixicon/vue'

interface UserDetail {
  id: number
  fullname: string
  username: string
  email: string | null
  nis: string | null
  nisn: string | null
  masa_studi: number | null
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

const isStudentMode = computed(() =>
  (route.name as string | undefined)?.startsWith('dashboard-siswa') ?? false,
)

// Ikut Users::calcTahunLulus: tahun lulus = (2000 + 2 digit NIS) + masa studi.
// Cth: NIS 234273345 + masa studi 4 => 2000 + 23 + 4 = 2027.
const calcTahunLulus = (nis: string | null, masaStudi: number | null): number | null => {
  const masa = Number(masaStudi ?? 0)
  if (!masa || masa < 1) return null
  const nisStr = String(nis ?? '')
  if (nisStr.length < 2 || !/^\d{2}/.test(nisStr.slice(0, 2))) return null
  return 2000 + Number(nisStr.slice(0, 2)) + masa
}

const user = ref<UserDetail | null>(null)
const isLoading = ref(true)

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
          <BackButton :to="isStudentMode ? '/dashboard/data-siswa' : '/dashboard/pengguna'" :sticky="false" />
        </span>

        <div class="border-t border-text-alt/50"></div>

        <h1 class="flex items-center gap-2 text-xl lg:text-2xl font-bold text-text-neutral"><RiUserSettingsLine class="w-6 h-6 text-primary shrink-0" />
          {{ isStudentMode ? 'Detail Siswa' : 'Detail Pengguna' }}
        </h1>
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

        <!-- NIS -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">NIS</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.nis || '-' }}
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

        <!-- Masa Studi -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Masa Studi</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ user.masa_studi != null ? `${user.masa_studi} tahun` : '-' }}
          </dd>
        </div>

        <!-- Tahun Lulus (dihitung) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 py-4 lg:py-5 border-b border-text-alt/15"
        >
          <dt class="text-sm lg:text-base font-semibold text-text-neutral">Tahun Lulus</dt>
          <dd class="sm:col-span-2 text-sm lg:text-base text-text-neutral wrap-break-word">
            {{ calcTahunLulus(user.nis, user.masa_studi) ?? '-' }}
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
            <DashboardStatusBadge :active="user.status_code === 'user_active'" />
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
