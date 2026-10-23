<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { RiLockLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const token = ref((route.query.token as string | undefined) || '')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const done = ref(false)
const formError = ref('')

const handleReset = async () => {
  formError.value = ''
  if (!token.value) {
    formError.value = 'Token tidak ditemukan. Buka kembali link dari email.'
    return
  }
  if (!newPassword.value) {
    formError.value = 'Password baru wajib diisi.'
    return
  }
  loading.value = true
  try {
    const response = await api.post('/no-auth/reset-password', {
      token: token.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    })
    toastStore.show(response.data?.message || 'Password berhasil diubah.', 'success')
    done.value = true
  } catch (err: any) {
    const data = err.response?.data
    const fieldMsg: string | undefined =
      data?.errors?.new_password?.[0] || data?.errors?.token?.[0]
    formError.value = fieldMsg || data?.message || 'Gagal mengubah password.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  if (!token.value) {
    formError.value = 'Token tidak ditemukan. Buka kembali link dari email.'
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
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
          Buat password baru untuk akun Anda. Link hanya berlaku 60 menit.
        </p>
      </div>
      <p class="md:hidden relative z-10 text-neutral/85 text-sm italic text-center mt-4">
        Buat password baru
      </p>
    </div>

    <div
      class="flex items-center justify-center bg-neutral px-6 sm:px-10 md:px-16 py-10 sm:py-14 md:w-1/2 md:min-h-screen"
    >
      <div class="w-full max-w-125">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-6 sm:mb-8">
          Reset Password
        </h2>

        <div v-if="done" class="rounded-2xl border border-success/40 bg-success/10 p-5 text-sm">
          <p class="text-text-neutral font-semibold">Password berhasil diubah!</p>
          <p class="text-text-alt mt-1">Silakan login dengan password baru Anda.</p>
          <button
            type="button"
            class="mt-4 text-sm text-primary font-semibold hover:underline cursor-pointer"
            @click="router.push('/login')"
          >
            Kembali ke Login
          </button>
        </div>

        <form v-else @submit.prevent="handleReset">
          <div class="mb-4 sm:mb-5">
            <label
              for="rp-new"
              class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
            >
              <RiLockLine class="w-4 h-4 text-text-alt" />
              Password Baru
            </label>
            <Input
              id="rp-new"
              v-model="newPassword"
              type="password"
              placeholder="Minimal 5 karakter"
            />
          </div>
          <div class="mb-5 sm:mb-6">
            <label
              for="rp-confirm"
              class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
            >
              <RiLockLine class="w-4 h-4 text-text-alt" />
              Konfirmasi Password Baru
            </label>
            <Input
              id="rp-confirm"
              v-model="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
            />
          </div>
          <p v-if="formError" class="mb-4 text-xs text-error">{{ formError }}</p>
          <div class="flex justify-center">
            <Button
              type="submit"
              :label="loading ? 'Memproses...' : 'Ubah Password'"
              :disabled="loading"
              class="w-full py-2 sm:py-2.5 text-sm sm:text-base font-semibold justify-center"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
