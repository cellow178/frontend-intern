<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useSiteDataStore } from '@/stores/siteData'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import Button from '../ui/Button.vue'
import {
  RiLoginBoxLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiMenuLine,
  RiCloseLine,
  RiUserLine,
  RiLoader4Line,
  RiUser3Line,
  RiDashboardLine,
  RiLogoutBoxRLine,
} from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

const props = withDefaults(
  defineProps<{
    transparent?: boolean
  }>(),
  {
    transparent: false,
  },
)

const store = useSiteDataStore()
const { schoolName, majors, isFullyLoaded } = storeToRefs(store)

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

const router = useRouter()
const route = useRoute()

const isScrolled = ref(false)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isMobileKompetensiOpen = ref(false)
const isAccountDropdownOpen = ref(false)
const accountDropdownRef = ref<HTMLElement | null>(null)
const toastStore = useToastStore()
const isLoggingOut = ref(false)

// Filter role dropdown menu
const hasAccountDropdown = computed(
  () =>
    isAuthenticated.value &&
    ['super-admin', 'guru', 'developer'].includes(user.value?.role_code ?? ''),
)

const menuItems = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Profil Sekolah', href: '#profil-sekolah' },
]

const menuItemsAfter = [
  { label: 'Event', to: '/event' },
  { label: 'Berita', to: '/berita' },
]

const menuItemsScroll = [{ label: 'Kritik Saran', href: '#kritik-saran' }]

const isWhiteMode = computed(() =>
  props.transparent ? isScrolled.value || isMobileMenuOpen.value || !isFullyLoaded.value : true,
)

const accountHref = computed(() => (isAuthenticated.value ? '/dashboard' : '/login'))
const accountLabel = computed(() =>
  isAuthenticated.value ? (user.value?.fullname ?? 'Akun Saya') : 'Login Siswa & Guru',
)

const scrollToSection = async (href: string) => {
  isDropdownOpen.value = false
  isMobileMenuOpen.value = false
  isMobileKompetensiOpen.value = false

  if (route.path !== '/') {
    await router.push('/')
    await nextTick()
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
    return
  }

  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

watch(
  () => props.transparent,
  (isTransparent) => {
    window.removeEventListener('scroll', handleScroll) // hindari listener dobel
    if (isTransparent) {
      window.addEventListener('scroll', handleScroll)
      handleScroll() // langsung cek posisi scroll saat ini, jangan tunggu event scroll berikutnya
    } else {
      isScrolled.value = false // reset, supaya halaman non-transparent tidak kebawa state lama
    }
  },
  { immediate: true }, // jalankan langsung saat komponen pertama kali mount
)

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
  isMobileMenuOpen.value = false
  toastStore.show('Logout berhasil.', 'info')
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  store.fetchGlobalConfig()
  store.fetchMajors()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 z-50 right-0 px-6 py-4 flex items-center justify-between transition-colors duration-300 lg:px-12"
    :class="isWhiteMode ? 'bg-neutral shadow-sm' : 'bg-transparent'"
  >
    <RouterLink
      to="/"
      @click="scrollToSection('#beranda')"
      class="flex items-center gap-2 cursor-pointer shrink-0"
    >
      <img :src="logoImg" class="w-5 h-5" />
      <span
        class="font-bold text-base lg:text-lg"
        :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
      >
        {{ schoolName }}
      </span>
    </RouterLink>

    <!-- Menu desktop -->
    <ul
      class="hidden lg:flex items-center gap-8 text-base font-normal"
      :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
    >
      <li v-for="item in menuItems" :key="item.href">
        <a
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>
      </li>

      <!-- Dropdown Kompetensi Keahlian -->
      <li class="relative" @mouseenter="isDropdownOpen = true" @mouseleave="isDropdownOpen = false">
        <button
          @click="scrollToSection('#kompetensi')"
          class="flex items-center gap-1 transition-colors cursor-pointer"
          :class="isDropdownOpen ? 'text-primary' : 'hover:text-primary'"
        >
          Kompetensi Keahlian
          <RiArrowDownSLine
            class="w-5 h-5 transition-transform duration-300"
            :class="isDropdownOpen ? '-rotate-180' : ''"
          />
        </button>
        <div
          v-if="isDropdownOpen"
          class="absolute top-full left-1/2 -translate-x-1/2 pt-2 bg-transparent w-96"
        >
          <div
            class="bg-neutral text-text-neutral rounded-2xl shadow-lg p-6 grid grid-cols-2 gap-x-8 gap-y-6"
          >
            <RouterLink
              v-for="major in majors"
              :key="major.id"
              :to="`/jurusan/${major.slug}`"
              @click="isDropdownOpen = false"
              class="flex items-center justify-between hover:bg-secondary hover:text-primary transition-colors rounded-lg px-3 py-2 -mx-3"
            >
              {{ major.code }}
              <RiArrowRightSLine class="w-5 h-5" />
            </RouterLink>
          </div>
        </div>
      </li>
      <li v-for="item in menuItemsAfter" :key="item.to">
        <RouterLink :to="item.to" class="hover:text-primary transition-colors cursor-pointer">
          {{ item.label }}
        </RouterLink>
      </li>

      <li v-for="item in menuItemsScroll" :key="item.href">
        <a
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>

    <!-- Login/Akun (desktop) + toggle mobile -->
    <div class="flex items-center gap-3">
      <!-- Akun dengan dropdown (super-admin & guru) HOVER MODE -->
      <div
        v-if="hasAccountDropdown"
        ref="accountDropdownRef"
        class="hidden lg:block relative"
        @mouseenter="isAccountDropdownOpen = true"
        @mouseleave="isAccountDropdownOpen = false"
      >
        <Button
          :label="accountLabel"
          size="sm"
          :icon-left="RiUserLine"
          :icon-right="RiArrowDownSLine"
        />
        <div
          v-if="isAccountDropdownOpen"
          class="absolute top-full right-0 pt-2 bg-transparent w-48"
        >
          <div class="bg-neutral text-text-neutral rounded-2xl shadow-lg p-2 flex flex-col">
            <RouterLink
              to="/profil"
              @click="isAccountDropdownOpen = false"
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-primary transition-colors text-sm font-medium"
            >
              <RiUser3Line class="w-4 h-4 shrink-0" />
              <span>Profil</span>
            </RouterLink>

            <RouterLink
              to="/dashboard"
              @click="isAccountDropdownOpen = false"
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-primary transition-colors text-sm font-medium"
            >
              <RiDashboardLine class="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </RouterLink>

            <button
              @click="handleLogout"
              :disabled="isLoggingOut"
              class="text-left px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm font-medium"
            >
              <RiLoader4Line v-if="isLoggingOut" class="w-4 h-4 animate-spin shrink-0" />
              <RiLogoutBoxRLine v-else class="w-4 h-4 shrink-0 text-red-500" />
              <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Akun tanpa dropdown (siswa & belum login) -->
      <RouterLink v-else :to="accountHref" class="hidden lg:block">
        <Button
          :label="accountLabel"
          size="sm"
          :icon-right="isAuthenticated ? undefined : RiLoginBoxLine"
          :icon-left="isAuthenticated ? RiUserLine : undefined"
        />
      </RouterLink>

      <button
        class="lg:hidden cursor-pointer shrink-0"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        aria-label="Toggle menu"
      >
        <RiCloseLine
          v-if="isMobileMenuOpen"
          class="w-5 h-5"
          :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
        />
        <RiMenuLine
          v-else
          class="w-5 h-5"
          :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
        />
      </button>
    </div>

    <!-- Backdrop overlay saat mobile menu terbuka -->
    <transition name="backdrop-fade">
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden fixed inset-0 top-18 bg-black/50 -z-10"
        @click="isMobileMenuOpen = false"
      />
    </transition>

    <!-- Menu mobile -->
    <transition name="mobile-menu">
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 bg-neutral shadow-lg px-6 py-4 flex flex-col gap-1 text-text-neutral max-h-[calc(100vh-4rem)] overflow-y-auto z-50"
      >
        <a
          v-for="item in menuItems"
          :key="item.href"
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="py-3 border-b border-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>

        <!-- Kompetensi Keahlian (accordion) -->
        <div class="border-b border-secondary">
          <button
            @click="isMobileKompetensiOpen = !isMobileKompetensiOpen"
            class="w-full flex items-center justify-between py-3 cursor-pointer"
            :class="isMobileKompetensiOpen ? 'text-primary' : ''"
          >
            Kompetensi Keahlian
            <RiArrowDownSLine
              class="w-5 h-5 transition-transform duration-300"
              :class="isMobileKompetensiOpen ? '-rotate-180' : ''"
            />
          </button>
          <div v-if="isMobileKompetensiOpen" class="flex flex-col gap-1 pb-3">
            <RouterLink
              v-for="major in majors"
              :key="major.id"
              :to="`/jurusan/${major.slug}`"
              @click="isMobileMenuOpen = false"
              class="flex items-center justify-between hover:bg-secondary hover:text-primary transition-colors rounded-lg px-3 py-2"
            >
              {{ major.code }}
              <RiArrowRightSLine class="w-5 h-5" />
            </RouterLink>
          </div>
        </div>

        <!-- Mobile: Event & Berita (route) -->
        <RouterLink
          v-for="item in menuItemsAfter"
          :key="item.to"
          :to="item.to"
          @click="isMobileMenuOpen = false"
          class="py-3 border-b border-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </RouterLink>

        <!-- Mobile: Kritik Saran (scroll) -->
        <a
          v-for="item in menuItemsScroll"
          :key="item.href"
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="py-3 border-b border-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>

        <!-- Mobile: super-admin & guru dapat 3 opsi -->
        <div v-if="hasAccountDropdown" class="mt-2 pt-3 border-t-2 border-primary/20">
          <div class="px-1 mb-2">
            <p class="text-sm font-semibold text-text-neutral truncate">{{ user?.fullname }}</p>
            <p class="text-xs text-primary uppercase tracking-wide">{{ user?.role_name }}</p>
          </div>
          <div class="bg-secondary rounded-xl overflow-hidden flex flex-col">
            <RouterLink
              to="/profil"
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-2.5 px-4 py-3 border-b border-neutral/40 hover:bg-secondary hover:text-primary transition-colors text-sm font-medium"
            >
              <RiUser3Line class="w-4 h-4 shrink-0" />
              <span>Profil</span>
            </RouterLink>

            <RouterLink
              to="/dashboard"
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-2.5 px-4 py-3 border-b border-neutral/40 hover:bg-secondary hover:text-primary transition-colors text-sm font-medium"
            >
              <RiDashboardLine class="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </RouterLink>

            <button
              @click="handleLogout"
              :disabled="isLoggingOut"
              class="text-left px-4 py-3 text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm font-medium"
            >
              <RiLoader4Line v-if="isLoggingOut" class="w-4 h-4 animate-spin shrink-0" />
              <RiLogoutBoxRLine v-else class="w-4 h-4 shrink-0" />
              <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
            </button>
          </div>
        </div>

        <!-- Mobile: siswa & belum login tetap tombol biasa -->
        <RouterLink v-else :to="accountHref" @click="isMobileMenuOpen = false" class="mt-2">
          <Button
            :label="accountLabel"
            size="sm"
            :icon-right="isAuthenticated ? undefined : RiLoginBoxLine"
            :icon-left="isAuthenticated ? RiUserLine : undefined"
            class="w-full justify-center"
          />
        </RouterLink>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.2s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>
