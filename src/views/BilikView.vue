<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import BackButton from '@/components/ui/BackButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiIdCardLine, RiLockPasswordLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

// Halaman ini khusus LOGIN bilik. Vote & done ada di route sendiri
// (/bilik/surat-suara, /bilik/selesai) agar tombol back tidak bisa dipakai
// mengintip surat suara pemilih sebelumnya.
type Stage = 'login' | 'redirecting'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const identifier = ref('')
const pass = ref('')
const isLoading = ref(false)
const loginError = ref('')

const stage = ref<Stage>('login')

// Bilik terkunci ke 1 event: /bilik/12. Tanpa :id = voting TPS yang dibuka.
const lockedVotingId = ref<number | null>(
  route.params.id ? Number(route.params.id) : null,
)
const lockedVotingTitle = ref('')
const boothVotingChoices = ref<{ id: number; title: string }[]>([])

const handleBoothLogin = async () => {
  loginError.value = ''
  if (!identifier.value.trim() || !pass.value.trim()) {
    loginError.value = 'NIS dan pass bilik wajib diisi.'
    return
  }
  isLoading.value = true
  try {
    // Tanpa :id di URL: pakai voting TPS yang sedang dibuka (pilihan pertama).
    let targetId = lockedVotingId.value
    if (!targetId) {
      const openList = await api.get('/no-auth/booth/open')
      const openVoting = (openList.data?.data ?? [])[0]
      if (!openVoting) {
        loginError.value = 'Belum ada voting TPS yang dibuka.'
        return
      }
      targetId = openVoting.id
    }
    const response = await api.post('/no-auth/booth/login', {
      voting_id: targetId,
      identifier: identifier.value.trim(),
      pass: pass.value.trim(),
    })
    const d = response.data?.data
    // Simpan sesi bilik di sessionStorage lalu pindah ke halaman surat suara.
    // sessionStorage (bukan localStorage) agar tertutup otomatis saat tab
    // browser ditutup, dan tombol back tidak membuka surat suara lama.
    sessionStorage.setItem(
      'bilik_session',
      JSON.stringify({
        voterName: d.fullname,
        votingTitle: d.voting.title,
        votingDesc: d.voting.description,
        candidates: d.candidates ?? [],
        ballotToken: d.ballot_token,
        votingId: d.voting.id,
      }),
    )
    // Bersihkan pass dari memori tampilan agar tidak terlihat siswa berikutnya.
    pass.value = ''
    identifier.value = ''
    stage.value = 'redirecting'
    router.push({ name: 'bilik-vote' })
  } catch (err: any) {
    loginError.value = err.response?.data?.message || 'Login bilik gagal.'
  } finally {
    isLoading.value = false
  }
}

// Info bilik terkunci (judul event) + daftar pilihan bila tanpa :id.
onMounted(async () => {
  siteDataStore.fetchGlobalConfig()
  try {
    const openList = await api.get('/no-auth/booth/open')
    boothVotingChoices.value = openList.data?.data ?? []
    if (lockedVotingId.value) {
      const found = boothVotingChoices.value.find((v) => v.id === lockedVotingId.value)
      lockedVotingTitle.value = found ? found.title : `Voting #${lockedVotingId.value}`
    }
  } catch {
    // Bilik tetap bisa dipakai — error secular ditangani saat login.
  }
})

</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <div
      class="relative flex flex-col overflow-hidden bg-linear-to-br from-primary to-accent px-6 sm:px-10 py-6 md:py-12 min-h-[30vh] md:min-h-screen md:w-1/2"
    >
      <div class="md:hidden relative z-10">
        <BackButton variant="white" to="/" :sticky="false" />
      </div>
      <div
        class="hidden md:flex relative z-10 flex-1 flex-col items-center justify-center text-center gap-6"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-neutral/95 flex items-center justify-center shadow-sm shrink-0">
            <img :src="logoImg" alt="" class="w-8 h-8 object-contain" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral leading-tight text-left max-w-xs">
            {{ schoolName }}
          </h1>
        </div>
        <div class="w-10 h-px bg-neutral/40" />
        <p class="text-neutral/85 text-base max-w-xs">
          Bilik suara TPS. Minta password bilik dari panitia. Pilihanmu berharga.
        </p>
      </div>
      <p class="md:hidden relative z-10 text-neutral/85 text-sm italic text-center mt-4">
        Bilik suara TPS
      </p>
    </div>

    <div class="flex items-center justify-center bg-neutral px-6 sm:px-10 md:px-16 py-10 md:w-1/2 md:min-h-screen">
      <div class="w-full max-w-125">
        <!-- LOGIN BILIK (satu-satunya tahap di halaman ini) -->
        <template v-if="stage === 'login'">
          <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">Bilik Suara</h2>
          <p v-if="lockedVotingId" class="text-sm font-semibold text-text-neutral mb-1">
            {{ lockedVotingTitle }}
          </p>
          <p v-else-if="boothVotingChoices.length > 1" class="text-sm text-text-alt mb-1">
            Voting yang dibuka: {{ boothVotingChoices.map((v) => v.title).join(' • ') }} — pass hanya berlaku untuk votingnya masing-masing.
          </p>

          <form @submit.prevent="handleBoothLogin">
            <div class="mb-4">
              <label class="flex items-center gap-1.5 text-sm font-medium text-text-neutral mb-1.5">
                <RiIdCardLine class="w-4 h-4 text-text-alt" />
                NIS
              </label>
              <Input v-model="identifier" type="text" placeholder="Masukkan NIS..." autocomplete="off" />
            </div>
            <div class="mb-5">
              <label class="flex items-center gap-1.5 text-sm font-medium text-text-neutral mb-1.5">
                <RiLockPasswordLine class="w-4 h-4 text-text-alt" />
                Password Bilik
              </label>
              <Input v-model="pass" type="password" placeholder="Masukkan password dari panitia..." inputmode="numeric" autocomplete="off" />
            </div>
            <p v-if="loginError" class="mb-4 text-xs text-error">{{ loginError }}</p>
            <Button
              type="submit"
              :label="isLoading ? 'Membuka...' : 'Buka Surat Suara'"
              :disabled="isLoading"
              class="w-full py-2.5 font-semibold justify-center"
            />
          </form>
        </template>

        <!-- STAGE VOTE / DONE dipindah ke halaman /bilik/surat-suara & /bilik/selesai -->
        <template v-else>
          <div class="flex justify-center py-8">
            <LoadingSpinner size="md" label="Membuka surat suara..." />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
