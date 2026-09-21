<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { dashboardMenu } from '@/config/dashboardMenu'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import {
  RiMenuLine,
  RiCloseLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiUser3Line,
  RiHomeLine,
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

const isActive = (routeName: string) => {
  if (!route.name) return false

  const targetPath = router.resolve({ name: routeName }).path

  if (routeName === 'dashboard') {
    return route.path === targetPath
  }

  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

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
  isLoggingOut.value = true // Aktifkan overlay loading

  try {
    await authStore.logout()
    toastStore.show('Logout berhasil.', 'info')
    router.push('/')
  } catch (error) {
    toastStore.show('Gagal keluar dari akun.', 'error')
  } finally {
    isLoggingOut.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <!-- Global Overlay Spinner saat Logout -->
  <LoadingSpinner v-if="isLoggingOut" :overlay="true" size="xl" label="Mengeluarkan akun..." />

  <!-- Main Viewport Shell -->
  <div class="h-screen w-full flex bg-secondary/30 overflow-hidden">
    <!-- Mobile Backdrop Overlay -->
    <transition name="backdrop-fade">
      <div
        v-if="isSidebarOpen"
        class="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
        @click="closeSidebar"
      />
    </transition>

    <!-- 1. SIDEBAR CONTAINER -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-72 bg-neutral border-r border-secondary flex flex-col transition-transform duration-250 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 h-full"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Sidebar Header / Logo -->
      <div class="flex items-center gap-3 px-6 h-16 border-b border-secondary shrink-0">
        <img :src="logoImg" alt="Logo" class="w-8 h-8 shrink-0" />
        <div class="leading-tight">
          <p class="font-bold text-sm text-text-neutral">SMKN 7 SEMARANG</p>
          <p class="text-[11px] text-text-alt">Admin Panel</p>
        </div>
        <button
          class="ml-auto lg:hidden text-text-alt hover:text-text-neutral"
          @click="closeSidebar"
          aria-label="Tutup menu"
        >
          <RiCloseLine class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <div v-for="(group, idx) in dashboardMenu" :key="idx">
          <p
            v-if="group.title"
            class="px-2 mb-2 text-[11px] font-semibold text-text-alt uppercase tracking-wider"
          >
            {{ group.title }}
          </p>
          <ul class="flex flex-col gap-1">
            <li v-for="item in group.items" :key="item.routeName">
              <RouterLink
                :to="{ name: item.routeName }"
                @click="closeSidebar"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                :class="
                  isActive(item.routeName)
                    ? 'bg-primary/10 text-primary font-semibold border-l-3'
                    : 'text-text-neutral hover:bg-secondary/80'
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

    <!-- 2. MAIN CONTENT AREA (Menyatu secara horizontal dengan Sidebar) -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- TOPBAR CONTAINER -->
      <header
        class="h-16 bg-neutral border-b border-secondary px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0"
      >
        <div class="flex items-center gap-3 min-w-0">
          <button
            class="lg:hidden text-text-neutral hover:text-primary transition-colors"
            @click="isSidebarOpen = true"
            aria-label="Buka menu"
          >
            <RiMenuLine class="w-6 h-6" />
          </button>

          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-1.5 text-sm min-w-0 overflow-x-auto">
            <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
              <span
                class="whitespace-nowrap"
                :class="
                  idx === breadcrumbs.length - 1
                    ? 'text-text-neutral font-semibold'
                    : 'text-text-alt'
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
        </div>

        <!-- Account Dropdown -->
        <div ref="accountDropdownRef" class="relative shrink-0">
          <button
            @click="isAccountDropdownOpen = !isAccountDropdownOpen"
            class="flex items-center gap-2.5 text-sm font-medium text-text-neutral p-1.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
          >
            <div
              class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold"
            >
              {{ user?.fullname?.charAt(0) || 'A' }}
            </div>
            <span class="hidden sm:block max-w-32 truncate">{{ user?.fullname }}</span>
            <RiArrowDownSLine
              class="w-4 h-4 text-text-alt transition-transform duration-200"
              :class="isAccountDropdownOpen ? 'rotate-180' : ''"
            />
          </button>

          <!-- Dropdown Menu Box -->
          <div
            v-if="isAccountDropdownOpen"
            class="absolute top-full right-0 mt-2 w-56 bg-neutral border border-secondary rounded-2xl shadow-xl p-1.5 z-50"
          >
            <div class="px-3 py-2 border-b border-secondary/60 mb-1">
              <p class="text-sm font-semibold text-text-neutral truncate">{{ user?.fullname }}</p>
              <p class="text-xs text-text-alt capitalize">
                {{ user?.role_name || 'Administrator' }}
              </p>
            </div>

            <RouterLink
              to="/profil"
              @click="isAccountDropdownOpen = false"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary transition-colors text-sm font-medium text-text-neutral"
            >
              <RiUser3Line class="w-4 h-4 shrink-0 text-text-alt" />
              <span>Profil</span>
            </RouterLink>

            <RouterLink
              to="/"
              @click="isAccountDropdownOpen = false"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary transition-colors text-sm font-medium text-text-neutral"
            >
              <RiHomeLine class="w-4 h-4 shrink-0 text-text-alt" />
              <span>Landing Page</span>
            </RouterLink>

            <button
              @click="handleLogout"
              class="w-full text-left px-3 py-2 rounded-xl hover:bg-error/10 hover:text-error transition-colors cursor-pointer flex items-center gap-2.5 text-sm font-medium text-text-neutral mt-1"
            >
              <RiLogoutBoxRLine class="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <!-- PAGE CONTENT BODY -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
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
