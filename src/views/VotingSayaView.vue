<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import BackButton from '@/components/ui/BackButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiChatPollLine, RiTimeLine, RiArrowDropRightLine } from '@remixicon/vue'

interface MyVoting {
  voting_id: number
  title: string
  mode: string
  is_open: boolean
  in_dpt: boolean
  has_voted: boolean
  finished: boolean
}

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { user } = storeToRefs(authStore)

const isLoading = ref(true)
const votings = ref<MyVoting[]>([])
const isSiswa = computed(() => user.value?.role_code === 'siswa' || user.value?.role_id === 3)

const remoteVotings = computed(() => votings.value.filter((v) => v.mode === 'remote'))

const fetchStatus = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/booth/my-status')
    votings.value = response.data?.data ?? []
  } catch {
    toastStore.show('Gagal memuat daftar voting.', 'error')
  } finally {
    isLoading.value = false
  }
}

const statusLabel = (v: MyVoting) => {
  if (!v.in_dpt) return 'Tidak terdaftar'
  if (v.has_voted) return 'Sudah memilih'
  if (v.finished) return 'Sudah selesai'
  if (!v.is_open) return 'Belum dibuka'
  return 'Dapat memilih'
}

// Buka surat suara di route sendiri (seperti bilik TPS) agar tombol back
// browser tidak kembali ke halaman ini melainkan ke daftar voting.
const chooseVoting = (v: MyVoting) => {
  router.push({ name: 'voting-saya-vote', params: { votingId: v.voting_id } })
}

const backTarget = computed(() => (isSiswa.value ? '/' : '/dashboard'))

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  fetchStatus()
})
</script>

<template>
  <!-- Desain mandiri (bukan pola login): header gradient primary->accent +
    konten kartu putih melayang. Warna hanya dari main.css. -->
  <div class="min-h-screen flex flex-col bg-secondary/40">
    <div
      class="relative overflow-hidden bg-linear-to-br from-primary to-accent px-4 sm:px-8 pt-4 sm:pt-6 pb-16 sm:pb-20 shrink-0"
    >
      <div
        class="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-neutral/10 blur-2xl"
      />
      <div
        class="pointer-events-none absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-neutral/10 blur-2xl"
      />
      <div class="hidden md:block absolute top-4 sm:top-6 left-4 sm:left-8 z-20">
        <BackButton variant="white" :to="backTarget" :sticky="false" />
      </div>
      <div class="relative z-10 mx-auto w-full max-w-3xl">
        <div class="md:hidden">
          <BackButton variant="white" :to="backTarget" :sticky="false" />
        </div>
        <div class="mt-4 sm:mt-6 text-center flex flex-col items-center">
          <h1
            class="mt-3 flex items-center justify-center gap-2.5 text-2xl sm:text-3xl font-bold text-neutral"
          >
            <RiChatPollLine class="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-neutral/90" />
            <h1>Voting Saya</h1>
          </h1>
        </div>
      </div>
    </div>

    <div class="flex-1 flex justify-center px-4 sm:px-8 pb-8 sm:pb-10">
      <div class="w-full max-w-3xl -mt-10 sm:-mt-12 relative z-10">
        <div v-if="isLoading" class="flex justify-center py-16">
          <LoadingSpinner size="lg" label="Memuat voting..." />
        </div>

        <!-- Daftar voting remote saya (halaman ini HANYA daftar) -->
        <div
          v-if="!isLoading && remoteVotings.length === 0"
          class="rounded-2xl border border-dashed border-secondary bg-neutral p-6 sm:p-8 text-center text-sm text-text-alt shadow-sm"
        >
          Tidak ada voting untuk Anda saat ini.
        </div>
        <div v-else-if="!isLoading" class="flex flex-col gap-2 sm:gap-3">
          <button
            v-for="v in remoteVotings"
            :key="v.voting_id"
            type="button"
            :disabled="!v.in_dpt || v.has_voted || !v.is_open"
            class="text-left rounded-2xl bg-neutral border p-4 sm:p-5 shadow-sm transition-all disabled:cursor-not-allowed touch-manipulation min-h-16"
            :class="
              v.has_voted
                ? 'border-success/40'
                : 'border-secondary hover:border-primary hover:shadow-md active:border-primary cursor-pointer'
            "
            @click="chooseVoting(v)"
          >
            <div class="flex items-center gap-3">
              <span
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="v.has_voted ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'"
              >
                <RiChatPollLine class="w-5 h-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-text-neutral text-sm sm:text-base">
                  {{ v.title }}
                </p>
                <p class="mt-0.5 text-xs text-text-alt flex items-center gap-1">
                  <RiTimeLine class="w-3.5 h-3.5 shrink-0" />
                  {{ statusLabel(v) }}
                </p>
              </div>
              <RiArrowDropRightLine
                class="text-primary font-bold shrink-0"
                :class="v.has_voted ? 'opacity-0' : ''"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
