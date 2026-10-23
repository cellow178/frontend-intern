<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { RiUserLine, RiLockLine, RiIdCardLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

type Tab = 'password' | 'username'

const router = useRouter()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const activeTab = ref<Tab>('password')
const loading = ref(false)

// --- Tab 1: lupa password ---
const identifier = ref('')
const identifierError = ref(false)
const forgotDone = ref(false)
const forgotMessage = ref('')
const forgotIsStudent = ref(false)

// --- Tab 2: lupa username, 1 kolom untuk semua role ---
// Guru/admin isi email (username dikirim ke email), siswa isi NIS/NISN
// (username dibalas langsung). Backend membedakan dari format isi.
const lookup = ref('')
const lookupError = ref(false)
const lookupErrorMessage = ref('')
const lookupDone = ref(false)
const lookupMessage = ref('')
const lookupIsEmail = ref(false)
const foundUsername = ref('')

const switchTab = (tab: Tab) => {
  activeTab.value = tab
  forgotDone.value = false
  lookupDone.value = false
  lookupMessage.value = ''
  foundUsername.value = ''
}

const handleForgotPassword = async () => {
  identifierError.value = false
  forgotDone.value = false
  if (!identifier.value.trim()) {
    identifierError.value = true
    return
  }
  loading.value = true
  try {
    const response = await api.post('/no-auth/forgot-password', {
      identifier: identifier.value.trim(),
    })
    forgotDone.value = true
    forgotMessage.value =
      response.data?.message || 'Permintaan diproses. Periksa email Anda bila akun ditemukan.'
    forgotIsStudent.value = !!response.data?.data?.is_student
  } catch (err: any) {
    const msg: string = err.response?.data?.message || 'Gagal memproses permintaan.'
    if (err.response?.status === 429) {
      toastStore.show(msg, 'error')
    } else {
      forgotDone.value = true
      forgotMessage.value = msg
      forgotIsStudent.value = !!err.response?.data?.data?.is_student
    }
  } finally {
    loading.value = false
  }
}

const handleRecoverUsername = async () => {
  lookupError.value = false
  lookupErrorMessage.value = ''
  lookupDone.value = false
  lookupMessage.value = ''
  foundUsername.value = ''
  const value = lookup.value.trim()
  if (!value) {
    lookupError.value = true
    return
  }
  loading.value = true
  try {
    // Ada '@' = email (guru/admin) -> username dikirim ke email.
    // Selain itu = NIS/NISN (siswa) -> username dibalas langsung.
    const isEmail = value.includes('@')
    lookupIsEmail.value = isEmail
    const response = await api.post(
      '/no-auth/recover-username',
      isEmail ? { email: value } : { identifier: value },
    )
    lookupDone.value = true
    lookupMessage.value =
      response.data?.message || 'Permintaan diproses. Periksa email Anda bila terdaftar.'
    foundUsername.value = response.data?.data?.username || ''
  } catch (err: any) {
    const msg: string = err.response?.data?.message || 'Gagal memproses permintaan.'
    if (err.response?.status === 429) {
      toastStore.show(msg, 'error')
    } else if (!lookupIsEmail.value) {
      lookupError.value = true
      lookupErrorMessage.value = msg
    } else {
      // Mode email selalu generik: tampilkan sebagai info, bukan error.
      lookupDone.value = true
      lookupMessage.value = msg
    }
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
const tabClass = computed(
  () => (tab: Tab) =>
    activeTab.value === tab
      ? 'flex-1 py-2.5 text-sm font-bold text-primary border-b-2 border-primary cursor-pointer'
      : 'flex-1 py-2.5 text-sm font-medium text-text-alt hover:text-text-neutral cursor-pointer',
)
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Panel kiri -->
    <div
      class="relative flex flex-col overflow-hidden bg-linear-to-br from-primary to-accent px-6 sm:px-10 py-6 sm:py-8 md:py-12 min-h-[38vh] md:min-h-screen md:w-1/2"
    >
      <div
        class="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-neutral/10 blur-2xl"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-neutral/10 blur-2xl"
      />
      <div class="md:hidden relative z-10">
        <BackButton variant="white" to="/login" :sticky="false" />
      </div>
      <div class="hidden md:block absolute top-6 left-6 md:left-10 z-20">
        <BackButton variant="white" to="/login" :sticky="false" />
      </div>
      <div
        class="hidden md:flex relative z-10 flex-1 flex-col items-center justify-center text-center gap-6 py-8 md:py-0"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl bg-neutral/95 flex items-center justify-center shadow-sm shrink-0"
          >
            <img :src="logoImg" alt="" class="w-8 h-8 object-contain" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral leading-tight text-left max-w-xs">
            {{ schoolName }}
          </h1>
        </div>
        <div class="w-10 h-px bg-neutral/40" />
        <p class="text-neutral/85 text-base max-w-xs">
          Lupa kredensial login? Ikuti langkah di halaman ini untuk memulihkan akses akun Anda.
        </p>
      </div>
      <p class="md:hidden relative z-10 text-neutral/85 text-sm italic text-center mt-4">
        Pulihkan akses akun Anda
      </p>
    </div>

    <!-- Panel kanan : form -->
    <div
      class="flex items-center justify-center bg-neutral px-6 sm:px-10 md:px-16 py-10 sm:py-14 md:w-1/2 md:min-h-screen"
    >
      <div class="w-full max-w-125">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">Lupa Password?</h2>
        <p class="text-sm text-text-alt mb-6">
          Pilih jenis bantuan di bawah. Link reset berlaku 60 menit dan hanya sekali pakai.
        </p>

        <!-- Tabs -->
        <div class="flex border-b border-secondary mb-6">
          <button type="button" :class="tabClass('password')" @click="switchTab('password')">
            Lupa Password
          </button>
          <button type="button" :class="tabClass('username')" @click="switchTab('username')">
            Lupa Username
          </button>
        </div>

        <!-- TAB 1 : lupa password -->
        <div v-if="activeTab === 'password'">
          <div v-if="!forgotDone">
            <form @submit.prevent="handleForgotPassword">
              <div class="mb-5">
                <label
                  for="fp-identifier"
                  class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
                >
                  <RiUserLine class="w-4 h-4 text-text-alt" />
                  Username / Email / NISN
                </label>
                <Input
                  id="fp-identifier"
                  v-model="identifier"
                  type="text"
                  placeholder="Masukan username, email, atau NISN"
                  :error="identifierError"
                />
                <p v-if="identifierError" class="mt-1 text-xs text-error">
                  Identitas wajib diisi.
                </p>
              </div>
              <Button
                type="submit"
                :label="loading ? 'Memproses...' : 'Kirim Instruksi'"
                :disabled="loading"
                class="w-full py-2 sm:py-2.5 text-sm sm:text-base font-semibold justify-center"
              />
            </form>
          </div>
          <div v-else class="rounded-2xl border border-secondary bg-secondary/30 p-5 text-sm">
            <p class="text-text-neutral leading-relaxed">{{ forgotMessage }}</p>
            <p v-if="forgotIsStudent" class="text-text-alt mt-2 leading-relaxed">
              Siswa: password awal = NISN. Bila sudah pernah diganti lalu lupa, hubungi wali kelas
              / admin dengan membawa NIS / NISN untuk reset manual.
            </p>
            <button
              type="button"
              class="mt-4 text-sm text-primary font-semibold hover:underline cursor-pointer"
              @click="goLogin"
            >
              Kembali ke Login
            </button>
          </div>
        </div>

        <!-- TAB 2 : lupa username — 1 kolom untuk semua role -->
        <div v-else>
          <form v-if="!lookupDone" @submit.prevent="handleRecoverUsername">
            <div class="mb-2">
              <label
                for="fu-lookup"
                class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
              >
                <RiIdCardLine class="w-4 h-4 text-text-alt" />
                Email / NIS / NISN
              </label>
              <Input
                id="fu-lookup"
                v-model="lookup"
                type="text"
                placeholder="Masukkan Email, NIS, atau NISN"
                :error="!!lookupError"
              />
              <p v-if="lookupError" class="mt-1 text-xs text-error">
                {{ lookupErrorMessage || 'Identitas wajib diisi.' }}
              </p>
            </div>
            <p class="mb-5 text-xs text-text-alt leading-relaxed">
              Isi email terdaftar bila Anda guru/admin (username dikirim ke email), atau NIS / NISN
              bila Anda siswa (username langsung ditampilkan).
            </p>
            <Button
              type="submit"
              :label="loading ? 'Memproses...' : 'Cari Username'"
              :disabled="loading"
              class="w-full py-2 sm:py-2.5 text-sm sm:text-base font-semibold justify-center"
            />
          </form>

          <!-- Hasil mode email : info generik -->
          <div
            v-else-if="lookupIsEmail"
            class="rounded-2xl border border-secondary bg-secondary/30 p-5 text-sm"
          >
            <p class="text-text-neutral leading-relaxed">{{ lookupMessage }}</p>
            <button
              type="button"
              class="mt-4 text-sm text-primary font-semibold hover:underline cursor-pointer"
              @click="goLogin"
            >
              Kembali ke Login
            </button>
          </div>

          <!-- Hasil mode siswa : username langsung -->
          <div v-else class="rounded-2xl border border-success/40 bg-success/10 p-5 text-sm">
            <p class="text-text-alt">Username Anda:</p>
            <p class="text-lg font-bold text-text-neutral">{{ foundUsername }}</p>
            <button
              type="button"
              class="mt-2 text-sm text-primary font-semibold hover:underline cursor-pointer"
              @click="goLogin"
            >
              Lanjut ke Login
            </button>
          </div>

          <!-- Fallback admin -->
          <div class="mt-6 rounded-2xl border border-secondary bg-secondary/20 p-4 text-sm">
            <p class="font-semibold text-text-neutral flex items-center gap-2">
              <RiLockLine class="w-4 h-4 text-text-alt" />
              Masih terkendala?
            </p>
            <p class="text-text-alt mt-1 leading-relaxed">
              Hubungi admin / wali kelas dengan membawa NIS / NISN atau identitas diri untuk reset
              manual.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
