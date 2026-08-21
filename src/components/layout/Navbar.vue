<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '../ui/Button.vue'
import {
  RiLoginBoxLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiMenuLine,
  RiCloseLine,
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
const { schoolName, majors } = storeToRefs(store)

const router = useRouter()
const route = useRoute()

const isScrolled = ref(false)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isMobileKompetensiOpen = ref(false)

const menuItems = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Profil', href: '#profil' },
]

const menuItemsAfter = [
  { label: 'Event', href: '#event' },
  { label: 'Berita', href: '#berita' },
  { label: 'Kritik Saran', href: '#kritik-saran' },
]

const isWhiteMode = computed(() =>
  props.transparent ? isScrolled.value || isMobileMenuOpen.value : true,
)

const scrollToSection = async (href: string) => {
  isDropdownOpen.value = false
  isMobileMenuOpen.value = false
  isMobileKompetensiOpen.value = false

  // kalau lagi bukan di halaman utama, navigasi dulu ke sana
  if (route.path !== '/') {
    await router.push('/')
    // tunggu DOM ke-render setelah pindah halaman
    await nextTick()
    // beri sedikit delay ekstra, jaga-jaga kalau ada async fetch/animasi
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

onMounted(() => {
  if (props.transparent) {
    window.addEventListener('scroll', handleScroll)
  }
  store.fetchGlobalConfig()
  store.fetchMajors()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
      <img :src="logoImg" class="w-7 h-7" />
      <span
        class="font-bold text-lg lg:text-xl"
        :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
      >
        {{ schoolName }}
      </span>
    </RouterLink>

    <!-- Menu desktop -->
    <ul
      class="hidden lg:flex items-center gap-8 text-lg font-normal"
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
          class="absolute top-full left-1/2 -translate-x-1/2 pt-3 bg-transparent w-96"
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
      <li v-for="item in menuItemsAfter" :key="item.href">
        <a
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>

    <!-- Login (desktop) + toggle mobile -->
    <div class="flex items-center gap-3">
      <RouterLink to="/login" class="hidden lg:block">
        <Button label="Login Siswa & Guru" size="sm" :icon-right="RiLoginBoxLine" />
      </RouterLink>

      <button
        class="lg:hidden cursor-pointer shrink-0"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        aria-label="Toggle menu"
      >
        <RiCloseLine
          v-if="isMobileMenuOpen"
          class="w-7 h-7"
          :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
        />
        <RiMenuLine
          v-else
          class="w-7 h-7"
          :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
        />
      </button>
    </div>

    <!-- Menu mobile -->
    <transition name="mobile-menu">
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 bg-neutral shadow-lg px-6 py-4 flex flex-col gap-1 text-text-neutral max-h-[calc(100vh-4rem)] overflow-y-auto"
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

        <a
          v-for="item in menuItemsAfter"
          :key="item.href"
          :href="item.href"
          @click.prevent="scrollToSection(item.href)"
          class="py-3 border-b border-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>

        <RouterLink to="/login" @click="isMobileMenuOpen = false" class="mt-4">
          <Button
            label="Login Siswa & Guru"
            size="sm"
            :icon-right="RiLoginBoxLine"
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
</style>
