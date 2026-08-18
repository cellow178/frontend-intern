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
  <div class="min-h-screen bg-linear-to-br from-primary to-accent flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
    <div class="w-full max-w-lg md:max-w-xl">
      <BackButton variant="white" class="mb-4 sm:mb-6" />

      <!-- Login Card -->
      <div class="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg h-fit">
        <div class="flex items-center px-6 sm:px-10 md:px-12 py-8 sm:py-10">
          <div class="w-full max-w-125 mx-auto">
            <!-- Title -->
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 sm:mb-8">
              Login
            </h2>

            <form @submit.prevent="handleLogin">
              <!-- Username -->
              <div class="mb-5 sm:mb-6">
                <label
                  for="username"
                  class="flex items-center gap-2 text-base sm:text-lg md:text-xl font-medium text-text-neutral mb-1.5 sm:mb-2"
                >
                  <RiUserLine class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  Email/Username
                </label>

                <Input
                  id="username"
                  v-model="username"
                  type="text"
                  placeholder="Masukan email atau username"
                  :error="usernameError"
                />

                <p v-if="loginError" class="mt-1 text-xs sm:text-sm text-red-500">
                  {{ loginError }}
                </p>
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label
                  for="password"
                  class="flex items-center gap-2 text-base sm:text-lg md:text-xl font-medium text-text-neutral mb-1.5 sm:mb-2"
                >
                  <RiLockLine class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
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
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                  >
                    <RiEyeOffLine v-if="showPassword" class="w-5 h-5 sm:w-6 sm:h-6" />
                    <RiEyeLine v-else class="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <p v-if="loginError" class="mt-1 text-xs sm:text-sm text-red-500">
                  {{ loginError }}
                </p>
              </div>

              <!-- Forgot Password -->
              <div class="mb-6 sm:mb-8">
                <RouterLink
                  to="/forgot-password"
                  class="text-sm sm:text-base text-primary font-semibold hover:underline"
                >
                  Lupa Password?
                </RouterLink>
              </div>

              <!-- Login Button -->
              <div class="flex justify-center">
                <Button
                  type="submit"
                  :label="loading ? 'Memproses...' : 'Masuk'"
                  :disabled="loading"
                  class="w-full py-2.5 sm:py-3 text-base sm:text-lg font-semibold justify-center"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>