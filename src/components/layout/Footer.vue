<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { RiYoutubeFill, RiInstagramFill, RiFacebookFill, RiLinkedinFill } from '@remixicon/vue'

const store = useSiteDataStore()
const { schoolName, motto, footer, majors } = storeToRefs(store)

const description = computed(() => footer.value.description)
const email = computed(() => footer.value.school_email)
const phone = computed(() => footer.value.school_telephone)

const menuItems = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Profil Sekolah', href: '#profil' },
  { label: 'Event', href: '#event' },
  { label: 'Berita', href: '#berita' },
  { label: 'Kompetensi Keahlian', href: '#kompetensi' },
  { label: 'Kritik & Saran', href: '#kritik-saran' },
]

const socialLinks = computed(() => [
  { icon: RiYoutubeFill, href: footer.value.yt },
  { icon: RiInstagramFill, href: footer.value.ig },
  { icon: RiFacebookFill, href: footer.value.fb },
  { icon: RiLinkedinFill, href: footer.value.linkedin },
])

const scrollToSection = (href: string) => {
  const target = document.querySelector(href)
  target?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  store.fetchGlobalConfig()
  store.fetchMajors()
})
</script>

<template>
  <footer class="bg-primary text-neutral flex flex-col px-6 py-10 gap-8 sm:px-8 sm:gap-10 lg:px-12 lg:py-12 lg:gap-12">
    <div class="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-10 lg:flex lg:items-start lg:justify-between lg:gap-6">
      <!-- Kolom Sekolah -->
      <div class="flex flex-col gap-3 col-span-2 sm:gap-4 lg:col-span-1 lg:w-fit lg:max-w-md">
        <div class="flex items-center gap-3 sm:gap-4">
          <img src="/src/assets/logo.png" class="w-11 h-11 sm:w-14 sm:h-14" />
          <div>
            <span class="font-bold text-lg sm:text-2xl">{{ schoolName }}</span>
            <p class="font-medium text-base sm:text-xl">{{ motto }}</p>
          </div>
        </div>
        <p class="leading-relaxed text-sm opacity-80 sm:text-base sm:leading-7">
          {{ description }}
        </p>
      </div>

      <!-- Kolom Navigasi Halaman -->
      <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
        <span class="font-semibold text-lg sm:text-2xl">Menu</span>
        <ul class="flex flex-col gap-2">
          <li v-for="item in menuItems" :key="item.href">
            <a
              :href="item.href"
              @click.prevent="scrollToSection(item.href)"
              class="text-sm font-light opacity-80 hover:underline cursor-pointer sm:text-lg"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Kolom Kompetensi Keahlian -->
      <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
        <span class="font-semibold text-lg sm:text-2xl">Kompetensi Keahlian</span>
        <div class="flex gap-x-6 sm:gap-x-10 lg:gap-x-20">
          <div class="flex flex-col gap-2 sm:gap-3">
            <a
              v-for="major in majors.slice(0, Math.ceil(majors.length / 2))"
              :key="major.id"
              :href="`/${major.slug}`"
              class="text-sm font-light opacity-80 hover:underline cursor-pointer sm:text-lg"
            >
              {{ major.code }}
            </a>
          </div>
          <div class="flex flex-col gap-2 sm:gap-3">
            <a
              v-for="major in majors.slice(Math.ceil(majors.length / 2))"
              :key="major.id"
              :href="`/${major.slug}`"
              class="text-sm font-light opacity-80 hover:underline cursor-pointer sm:text-lg"
            >
              {{ major.code }}
            </a>
          </div>
        </div>
      </div>

      <!-- Kolom Kontak -->
      <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
        <span class="font-semibold text-lg sm:text-2xl">Kontak Kami</span>
        <a :href="`mailto:${email}`" class="underline text-sm sm:text-base break-all">
          {{ email }}
        </a>
        <p class="text-sm sm:text-base">{{ phone }}</p>
        <div class="flex items-center gap-3">
          <a
            v-for="(social, index) in socialLinks"
            :key="index"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="w-9 h-9 rounded-full bg-neutral flex items-center justify-center hover:opacity-80 transition-opacity sm:w-10 sm:h-10"
          >
            <component :is="social.icon" class="w-4 h-4 text-primary sm:w-5 sm:h-5" />
          </a>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="border-t border-neutral"></div>

    <!-- Copyright -->
    <p class="text-center text-xs opacity-90 sm:text-sm">
      © {{ new Date().getFullYear() }} {{ schoolName }}. All right reserved.
    </p>
  </footer>
</template>