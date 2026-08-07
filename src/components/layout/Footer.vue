<script setup lang="ts">
import { computed, onMounted } from 'vue'
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
  <footer class="bg-primary text-neutral flex flex-col px-12 py-12 gap-12">
    <div class="flex items-start justify-between">
      <!-- Kolom Sekolah -->
      <div class="w-fit flex flex-col gap-4 max-w-md">
        <div class="flex items-center gap-4">
          <img src="/src/assets/logo.png" class="w-14 h-14" />
          <div>
            <span class="font-bold text-2xl">{{ schoolName }}</span>
            <p class="font-medium text-xl">{{ motto }}</p>
          </div>
        </div>
        <p class="leading-7 opacity-80">
          {{ description }}
        </p>
      </div>

      <!-- Kolom Navigasi Halaman -->
      <div class="w-fit flex flex-col gap-4">
        <span class="font-semibold text-2xl">Menu</span>
        <ul class="flex flex-col gap-2">
          <li v-for="item in menuItems" :key="item.href">
            <a
              :href="item.href"
              @click.prevent="scrollToSection(item.href)"
              class="text-lg font-light opacity-80 hover:underline cursor-pointer"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Kolom Kompetensi Keahlian -->
      <div class="w-fit flex flex-col gap-4">
        <span class="font-semibold text-2xl">Kompetensi Keahlian</span>
        <div class="flex gap-x-20">
          <div class="flex flex-col gap-3">
            <a
              v-for="major in majors.slice(0, Math.ceil(majors.length / 2))"
              :key="major.id"
              :href="`/${major.slug}`"
              class="text-lg font-light opacity-80 hover:underline cursor-pointer"
            >
              {{ major.code }}
            </a>
          </div>
          <div class="flex flex-col gap-3">
            <a
              v-for="major in majors.slice(Math.ceil(majors.length / 2))"
              :key="major.id"
              :href="`/${major.slug}`"
              class="text-lg font-light opacity-80 hover:underline cursor-pointer"
            >
              {{ major.code }}
            </a>
          </div>
        </div>
      </div>

      <!-- Kolom Kontak -->
      <div class="w-fit flex flex-col gap-4">
        <span class="font-semibold text-2xl">Kontak Kami</span>
        <a :href="`mailto:${email}`" class="underline">
          {{ email }}
        </a>
        <p>{{ phone }}</p>
        <div class="flex items-center gap-3">
          <a
            v-for="(social, index) in socialLinks"
            :key="index"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="w-10 h-10 rounded-full bg-neutral flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <component :is="social.icon" class="w-5 h-5 text-primary" />
          </a>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="border-t border-neutral"></div>

    <!-- Copyright -->
    <p class="text-center text-sm opacity-90">
      © {{ new Date().getFullYear() }} {{ schoolName }}. All right reserved.
    </p>
  </footer>
</template>