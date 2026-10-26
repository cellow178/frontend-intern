<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { RiUserLine, RiLockLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const loading = ref(false)
const identifier = ref('')
const identifierError = ref(false)
const done = ref(false)
const doneMessage = ref('')

const handleForgotPassword = async () => {
  identifierError.value = false
  done.value = false
  if (!identifier.value.trim()) {
    identifierError.value = true
    return
  }
  loading.value = true
  try {
    const response = await api.post('/no-auth/forgot-password', {
      identifier: identifier.value.trim(),
    })
    done.value = true
    doneMessage.value =
      response.data?.message || 'Permintaan diproses. Periksa email Anda bila akun ditemukan.'
  } catch (err: any) {
    // Selain rate-limit, backend selalu 200 generik — jadi error di sini
    // hanya 429 atau gangguan jaringan/server.
    const msg: string = err.response?.data?.message || 'Gagal memproses permintaan.'
    if (err.response?.status === 429) {
      toastStore.show(msg, 'error')
    } else {
      done.value = true
      doneMessage.value = msg
    }
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
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
          Lupa password? Masukkan identitas akun Anda dan ikuti instruksi yang dikirim ke email
          terdaftar.
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
          Masukkan username, email, atau NISN Anda. Link reset berlaku 60 menit dan hanya sekali
          pakai.
        </p>

        <div v-if="!done">
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
                placeholder="Masukkan username, email, atau NISN"
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
          <p class="text-text-neutral leading-relaxed">{{ doneMessage }}</p>
          <button
            type="button"
            class="mt-4 text-sm text-primary font-semibold hover:underline cursor-pointer"
            @click="goLogin"
          >
            Kembali ke Login
          </button>
        </div>

        <!-- Fallback: NISN & admin (statis, sama untuk semua pengunjung) -->
        <div class="mt-6 rounded-2xl border border-secondary bg-secondary/20 p-4 text-sm">
          <p class="font-semibold text-text-neutral flex items-center gap-2">
            <RiLockLine class="w-4 h-4 text-text-alt" />
            Siswa yang belum pernah ganti password?
          </p>
          <p class="text-text-alt mt-1 leading-relaxed">
            Coba login dengan password = NISN Anda. Bila tetap tidak bisa masuk (misalnya sudah
            pernah diganti lalu lupa), hubungi wali kelas / admin dengan membawa NIS / NISN untuk
            reset manual. Lupa username juga ditangani admin dengan membawa identitas diri.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
