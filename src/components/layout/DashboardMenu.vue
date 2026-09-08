<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { dashboardMenu } from '@/config/dashboardMenu'
import {
  RiMenuLine,
  RiCloseLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiUser3Line,
  RiHomeLine,
  RiLoader4Line,
} from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { user } = storeToRefs(authStore)

const isSidebarOpen = ref(false)
const isAccountDropdownOpen = ref(false)
const accountDropdownRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)

const isActive = (routeName: string) => route.name === routeName

const breadcrumbs = computed(() => {
  const trail = (route.meta.breadcrumb as string[] | undefined) ?? []
  return ['Dashboard', ...trail]
})

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (accountDropdownRef.value && !accountDropdownRef.value.contains(event.target as Node)) {
    isAccountDropdownOpen.value = false
  }
}

const handleLogout = async () => {
  isAccountDropdownOpen.value = false
  isLoggingOut.value = true

  await authStore.logout()

  isLoggingOut.value = false
  toastStore.show('Logout berhasil.', 'info')
  router.push('/')
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen flex bg-secondary/50">
    <!-- Backdrop overlay, mobile only -->
    <transition name="backdrop-fade">
      <div
        v-if="isSidebarOpen"
        class="lg:hidden fixed inset-0 bg-black/50 z-40"
        @click="closeSidebar"
      />
    </transition>

    <!-- Sidebar -->
    <transition name="sidebar-slide">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-50 w-72 bg-neutral border-r border-secondary flex flex-col transition-transform duration-250 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0"
        :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <!-- Logo & judul -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-secondary">
          <img :src="logoImg" alt="" class="w-9 h-9 shrink-0" />
          <div class="leading-tight">
            <p class="font-bold text-sm text-text-neutral">SMKN 7 SEMARANG</p>
            <p class="text-xs text-text-alt">Admin Panel</p>
          </div>
          <button
            class="ml-auto lg:hidden text-text-alt hover:text-text-neutral"
            @click="closeSidebar"
            aria-label="Tutup menu"
          >
            <RiCloseLine class="w-5 h-5" />
          </button>
        </div>

        <!-- Menu -->
        <nav class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <div v-for="(group, idx) in dashboardMenu" :key="idx">
            <p
              v-if="group.title"
              class="px-2 mb-2 text-xs font-semibold text-text-alt uppercase tracking-wide"
            >
              {{ group.title }}
            </p>
            <ul class="flex flex-col gap-1">
              <li v-for="item in group.items" :key="item.routeName">
                <RouterLink
                  :to="{ name: item.routeName }"
                  @click="closeSidebar"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    isActive(item.routeName)
                      ? 'bg-secondary text-primary'
                      : 'text-text-neutral hover:bg-secondary/60'
                  "
                >
                  <component :is="item.icon" class="w-5 h-5 shrink-0" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </transition>

    <!-- Konten utama -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header
        class="sticky top-0 z-30 bg-neutral border-b border-secondary px-4 sm:px-6 py-4 flex items-center gap-4"
      >
        <button
          class="lg:hidden text-text-neutral"
          @click="isSidebarOpen = true"
          aria-label="Buka menu"
        >
          <RiMenuLine class="w-6 h-6" />
        </button>

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-sm min-w-0 overflow-x-auto">
          <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
            <span
              class="whitespace-nowrap"
              :class="
                idx === breadcrumbs.length - 1 ? 'text-text-neutral font-semibold' : 'text-text-alt'
              "
            >
              {{ crumb }}
            </span>
            <RiArrowRightSLine
              v-if="idx < breadcrumbs.length - 1"
              class="w-4 h-4 text-text-alt shrink-0"
            />
          </template>
        </nav>

        <!-- User info dengan dropdown, kanan -->
        <div ref="accountDropdownRef" class="ml-auto relative shrink-0">
          <button
            @click="isAccountDropdownOpen = !isAccountDropdownOpen"
            class="flex items-center gap-2 text-sm font-medium text-text-neutral cursor-pointer"
          >
            <!-- Mobile: ikon + label singkat -->
            <RiUser3Line class="w-5 h-5 sm:hidden" />
            <span class="sm:hidden">Akun</span>

            <!-- Desktop: fullname -->
            <span class="hidden sm:block">{{ user?.fullname }}</span>

            <RiArrowDownSLine
              class="w-4 h-4 text-text-alt transition-transform duration-200"
              :class="isAccountDropdownOpen ? 'rotate-180' : ''"
            />
          </button>

          <div v-if="isAccountDropdownOpen" class="absolute top-full right-0 pt-2 w-56 z-40">
            <div class="bg-neutral border border-secondary rounded-xl shadow-lg p-2 flex flex-col">
              <!-- Header: fullname + role -->
              <div class="px-4 py-2.5 border-b border-secondary mb-1">
                <p class="text-sm font-semibold text-text-neutral truncate">{{ user?.fullname }}</p>
                <p class="text-xs text-text-alt capitalize">{{ user?.role_name }}</p>
              </div>

              <RouterLink
                to="/profil"
                @click="isAccountDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-primary transition-colors text-sm font-medium text-text-neutral"
              >
                <RiUser3Line class="w-4 h-4 shrink-0" />
                <span>Profil</span>
              </RouterLink>

              <RouterLink
                to="/"
                @click="isAccountDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-primary transition-colors text-sm font-medium text-text-neutral"
              >
                <RiHomeLine class="w-4 h-4 shrink-0" />
                <span>Landing Page</span>
              </RouterLink>

              <button
                @click="handleLogout"
                :disabled="isLoggingOut"
                class="text-left px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm font-medium"
              >
                <RiLoader4Line v-if="isLoggingOut" class="w-4 h-4 animate-spin shrink-0" />
                <RiLogoutBoxRLine v-else class="w-4 h-4 shrink-0" />
                <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Isi halaman -->
      <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>
