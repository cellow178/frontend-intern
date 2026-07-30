<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from '../ui/Button.vue'
import { RiLoginBoxLine, RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    transparent?: boolean
  }>(),
  {
    transparent: false,
  }
)

const isScrolled = ref(false)
const schoolName = ref('')
const isDropdownOpen = ref(false)
const majors = ref<{ id: number; code: string; slug: string }[]>([])

const menuItems = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Profil', href: '#profil' },
]

const menuItemsAfter = [
  { label: 'Event', href: '#event' },
  { label: 'Berita', href: '#berita' },
  { label: 'Kritik Saran', href: '#kritik-saran' },
]

const isWhiteMode = computed(() => (props.transparent ? isScrolled.value : true))

const scrollToSection = (href: string) => {
  isDropdownOpen.value = false
  const target = document.querySelector(href)
  target?.scrollIntoView({ behavior: 'smooth' })
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const fetchSchoolName = async () => {
  try {
    const response = await api.get('/no-auth/global-config')
    schoolName.value = response.data.data.school_name
  } catch (err) {
    console.error('Gagal ambil data global config:', err)
  }
}

const fetchMajors = async () => {
  try {
    const response = await api.get('/no-auth/majors')
    majors.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil data majors:', err)
  }
}

onMounted(() => {
  if (props.transparent) {
    window.addEventListener('scroll', handleScroll)
  }
  fetchSchoolName()
  fetchMajors()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 px-12 py-4 flex items-center justify-between transition-colors duration-300"
    :class="isWhiteMode ? 'bg-neutral shadow-sm' : 'bg-transparent'"
  >
    <a href="#beranda" class="flex items-center gap-2 cursor-pointer">
        <img src="/src/assets/logo.png" class="w-7 h-7" />
        <span
            class="font-bold text-xl transition-colors duration-300"
            :class="isWhiteMode ? 'text-text-neutral' : 'text-neutral'"
        >
        {{ schoolName }}
        </span>
    </a>

    <ul
        class="flex items-center gap-8 text-lg font-normal transition-colors duration-300"
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
        <li
        class="relative"
        @mouseenter="isDropdownOpen = true"
        @mouseleave="isDropdownOpen = false"
        >
        <button
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
            <div class="bg-neutral text-text-neutral rounded-2xl shadow-lg p-6 grid grid-cols-2 gap-x-8 gap-y-6">
                 <a
                    v-for="major in majors"
                    :key="major.id"
                    :href="`/${major.slug}`"
                    class="flex items-center justify-between hover:bg-secondary hover:text-primary transition-colors rounded-lg px-3 py-2 -mx-3"
                >
                    {{ major.code }}
                    <RiArrowRightSLine class="w-5 h-5" />
                </a>
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

    <Button label="Login" :icon-right="RiLoginBoxLine" />
  </nav>
</template>