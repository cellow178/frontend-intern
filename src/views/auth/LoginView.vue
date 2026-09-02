<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'
import { RiUserLine, RiLockLine, RiEyeLine, RiEyeOffLine } from '@remixicon/vue'

import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

import { useSiteDataStore } from '@/stores/siteData'
import { useAuthStore } from '@/stores/auth'

import logoImg from '@/assets/logo.png'
import BackButton from '@/components/ui/BackButton.vue'

const router = useRouter()

const siteDataStore = useSiteDataStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const { schoolName, motto } = storeToRefs(siteDataStore)
const { loading } = storeToRefs(authStore)

const username = ref('')
const password = ref('')
const showPassword = ref(false)

const usernameError = ref(false)
const passwordError = ref(false)

const loginError = ref('')

const handleLogin = async () => {
  // Reset error
  usernameError.value = false
  passwordError.value = false
  loginError.value = ''

  // Validasi input kosong
  if (!username.value) {
    usernameError.value = true
  }

  if (!password.value) {
    passwordError.value = true
  }

  if (!username.value || !password.value) {
    return
  }

  const result = await authStore.login(username.value, password.value)

  // Login berhasil
  if (result.success) {
    toastStore.show('Login berhasil!', 'success')
    router.push('/')
    return
  }

  // Semua kegagalan login
  usernameError.value = true
  passwordError.value = true
  loginError.value = 'Username atau password salah.'
  toastStore.show('Gagal login.', 'error')
}

watch(username, () => {
  usernameError.value = false
})

watch(password, () => {
  passwordError.value = false
})

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Gradient branding: full screen di mobile, half di md+ -->
    <div
      class="relative flex flex-col overflow-hidden bg-linear-to-br from-primary to-accent px-6 sm:px-10 py-6 sm:py-8 md:py-12 min-h-screen md:min-h-screen md:w-1/2"
    >
      <div
        class="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-neutral/10 blur-2xl"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-neutral/10 blur-2xl"
      ></div>

      <BackButton variant="white" class="relative z-10" />

      <!-- Branding besar (logo + nama sekolah): disembunyikan di mobile, tampil dari md ke atas -->
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

        <div class="w-10 h-px bg-neutral/40"></div>

        <p class="text-neutral/85 text-base italic max-w-xs">"{{ motto }}"</p>
      </div>

      <!-- Motto singkat: tampil di mobile juga, di atas card -->
      <p class="md:hidden relative z-10 text-neutral/85 text-sm italic text-center mt-4">
        "{{ motto }}"
      </p>

      <!-- Card form: mengambang di tengah, khusus mobile -->
      <div class="relative z-10 flex-1 flex items-center justify-center md:hidden">
        <div class="w-full max-w-sm bg-neutral rounded-2xl shadow-xl px-6 py-8">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-sm shrink-0"
            >
              <img :src="logoImg" alt="" class="w-6 h-6 object-contain" />
            </div>
            <h1 class="text-lg font-bold text-text-neutral leading-tight">{{ schoolName }}</h1>
          </div>

          <h2 class="text-xl font-bold text-primary mb-5">Login</h2>

          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label
                for="username-mobile"
                class="flex items-center gap-1.5 text-sm font-medium text-text-neutral mb-1.5"
              >
                <RiUserLine class="w-4 h-4 text-text-alt" />
                Email/Username
              </label>

              <Input
                id="username-mobile"
                v-model="username"
                type="text"
                placeholder="Masukan email atau username"
                :error="usernameError"
              />

              <p v-if="loginError" class="mt-1 text-xs text-red-500">
                {{ loginError }}
              </p>
            </div>

            <div class="mb-3">
              <label
                for="password-mobile"
                class="flex items-center gap-1.5 text-sm font-medium text-text-neutral mb-1.5"
              >
                <RiLockLine class="w-4 h-4 text-text-alt" />
                Password
              </label>

              <div class="relative">
                <Input
                  id="password-mobile"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukan password"
                  :error="passwordError"
                />

                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-alt hover:text-primary transition-colors"
                >
                  <RiEyeOffLine v-if="showPassword" class="w-4 h-4" />
                  <RiEyeLine v-else class="w-4 h-4" />
                </button>
              </div>

              <p v-if="loginError" class="mt-1 text-xs text-red-500">
                {{ loginError }}
              </p>
            </div>

            <div class="mb-5">
              <RouterLink
                to="/forgot-password"
                class="text-xs text-primary font-semibold hover:underline"
              >
                Lupa Password?
              </RouterLink>
            </div>

            <div class="flex justify-center">
              <Button
                type="submit"
                :label="loading ? 'Memproses...' : 'Masuk'"
                :disabled="loading"
                class="w-full py-2 text-sm font-semibold justify-center"
              />
            </div>
          </form>
        </div>
      </div>

      <!-- Deskripsi akses: tampil di semua ukuran layar -->
      <p class="relative z-10 text-neutral/60 text-sm text-center mt-4 md:mt-0">
        Akses khusus civitas sekolah — Siswa, Guru & Staff
      </p>
    </div>

    <!-- Right: plain form half, hanya tampil dari md ke atas -->
    <div
      class="hidden md:flex items-center justify-center bg-neutral px-6 sm:px-10 md:px-16 py-10 sm:py-14 md:w-1/2 md:min-h-screen"
    >
      <div class="w-full max-w-125">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-6 sm:mb-8">Login</h2>

        <form @submit.prevent="handleLogin">
          <div class="mb-4 sm:mb-5">
            <label
              for="username"
              class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
            >
              <RiUserLine class="w-4 h-4 text-text-alt" />
              Email/Username
            </label>

            <Input
              id="username"
              v-model="username"
              type="text"
              placeholder="Masukan email atau username"
              :error="usernameError"
            />

            <p v-if="loginError" class="mt-1 text-xs text-red-500">
              {{ loginError }}
            </p>
          </div>

          <div class="mb-3">
            <label
              for="password"
              class="flex items-center gap-1.5 text-sm sm:text-base font-medium text-text-neutral mb-1 sm:mb-1.5"
            >
              <RiLockLine class="w-4 h-4 text-text-alt" />
              Password
            </label>

            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukan password"
                :error="passwordError"
              />

              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-alt hover:text-primary transition-colors"
              >
                <RiEyeOffLine v-if="showPassword" class="w-4 h-4 sm:w-5 sm:h-5" />
                <RiEyeLine v-else class="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <p v-if="loginError" class="mt-1 text-xs text-red-500">
              {{ loginError }}
            </p>
          </div>

          <div class="mb-5 sm:mb-6">
            <RouterLink
              to="/forgot-password"
              class="text-xs sm:text-sm text-primary font-semibold hover:underline"
            >
              Lupa Password?
            </RouterLink>
          </div>

          <div class="flex justify-center">
            <Button
              type="submit"
              :label="loading ? 'Memproses...' : 'Masuk'"
              :disabled="loading"
              class="w-full py-2 sm:py-2.5 text-sm sm:text-base font-semibold justify-center"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
