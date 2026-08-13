<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
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

const { schoolName, motto } = storeToRefs(siteDataStore)
const { loading } = storeToRefs(authStore)

const username = ref('')
const password = ref('')
const showPassword = ref(false)

const usernameError = ref(false)
const passwordError = ref(false)

const usernameErrorMessage = ref('')
const passwordErrorMessage = ref('')

const handleLogin = async () => {
  // Reset error
  usernameError.value = false
  passwordError.value = false

  usernameErrorMessage.value = ''
  passwordErrorMessage.value = ''

  // Validasi input kosong
  if (!username.value) {
    usernameError.value = true
    usernameErrorMessage.value = 'Username wajib diisi.'
  }

  if (!password.value) {
    passwordError.value = true
    passwordErrorMessage.value = 'Password wajib diisi.'
  }

  if (!username.value || !password.value) {
    return
  }

  const result = await authStore.login(username.value, password.value)

  // Login berhasil
  if (result.success) {
    router.push('/')
    return
  }

  // Username tidak ditemukan
  if (result.message === 'message.userNotFound') {
    usernameError.value = true
    usernameErrorMessage.value = 'User tidak ditemukan.'
    return
  }

  // Password / credential salah
  if (result.message === 'message.loginCredentialFalse') {
    passwordError.value = true
    passwordErrorMessage.value = 'Password salah.'
    return
  }
}

watch(username, () => {
  usernameError.value = false
  usernameErrorMessage.value = ''
})

watch(password, () => {
  passwordError.value = false
  passwordErrorMessage.value = ''
})

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
})
</script>

<template>
  <div class="min-h-screen bg-[#fdf8f2] flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-262.5">
      <BackButton class="mb-6" />

      <!-- Login Card -->
      <div
        class="bg-white rounded-[25px] overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2 min-h-136.25"
      >
        <!-- LEFT SIDE -->
        <div
          class="relative flex flex-col items-center justify-center text-white px-10 py-14 overflow-hidden"
          style="background: linear-gradient(180deg, #5b2d00 0%, #ff963e 100%)"
        >
          <!-- Decorative -->
          <div class="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-orange-300/10 blur-3xl" />

          <div
            class="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-orange-200/10 blur-3xl"
          />

          <div class="relative z-10 text-center">
            <h1 class="text-3xl md:text-[32px] font-bold mb-2">Selamat Datang!</h1>

            <p class="text-xl md:text-[21px] font-bold">
              Website Resmi
              <span class="text-[#ff963e]">
                {{ schoolName }}
              </span>
            </p>

            <p class="text-lg mt-3 font-medium">
              {{ motto }}
            </p>

            <!-- Logo -->
            <div class="mt-8 flex justify-center">
              <img :src="logoImg" :alt="`Logo ${schoolName}`" class="w-36 h-36 object-contain" />
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE -->
        <div class="flex items-center px-10 md:px-12 lg:px-14 py-12">
          <div class="w-full max-w-125 mx-auto">
            <!-- Title -->
            <h2 class="text-4xl font-bold text-primary mb-10">Login</h2>

            <form @submit.prevent="handleLogin">
              <!-- Username -->
              <div class="mb-7">
                <label
                  for="username"
                  class="flex items-center gap-2 text-xl font-medium text-text-neutral mb-2"
                >
                  <RiUserLine class="w-6 h-6 text-gray-500" />
                  Email/Username
                </label>

                <Input
                  id="username"
                  v-model="username"
                  type="text"
                  placeholder="Masukan email atau username"
                  :error="usernameError"
                />

                <p v-if="usernameErrorMessage" class="mt-1 text-sm text-red-500">
                  {{ usernameErrorMessage }}
                </p>
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label
                  for="password"
                  class="flex items-center gap-2 text-xl font-medium text-text-neutral mb-2"
                >
                  <RiLockLine class="w-6 h-6 text-gray-500" />
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
                    <RiEyeOffLine v-if="showPassword" class="w-6 h-6" />

                    <RiEyeLine v-else class="w-6 h-6" />
                  </button>
                </div>

                <p v-if="passwordErrorMessage" class="mt-1 text-sm text-red-500">
                  {{ passwordErrorMessage }}
                </p>
              </div>

              <!-- Forgot Password -->
              <div class="flex justify-end mb-9">
                <RouterLink
                  to="/forgot-password"
                  class="text-primary font-semibold hover:underline"
                >
                  Lupa Password?
                </RouterLink>
              </div>

              <!-- Login -->
              <div class="flex justify-center">
                <Button
                  type="submit"
                  :label="loading ? 'Memproses...' : 'Masuk'"
                  size="sm"
                  :disabled="loading"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
