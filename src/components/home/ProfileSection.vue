<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { getFullFileUrl } from '@/utils/file'
import { RiSchoolFill } from '@remixicon/vue'
import RichTextContent from '@/components/ui/RichTextContent.vue' // Import komponen RichTextContent

const store = useSiteDataStore()
const { motto, profile } = storeToRefs(store)

const title = computed(() => profile.value.title)
const profileDesc = computed(() => profile.value.description)

const img1 = computed(() => getFullFileUrl(profile.value.img_1))
const img2 = computed(() => getFullFileUrl(profile.value.img_2))

const imageContainerClass = computed(() => {
  if (img2.value) {
    return 'w-full max-w-104 sm:max-w-none sm:flex-row lg:flex-col lg:gap-8 lg:w-auto lg:max-w-104'
  }

  return 'w-full max-w-104 sm:max-w-none lg:w-130 lg:max-w-none'
})

const DESC_LENGTH_THRESHOLD = 400
const descTextSize = computed(() =>
  (profileDesc.value?.length || 0) > DESC_LENGTH_THRESHOLD
    ? 'text-sm lg:text-base md:text-base'
    : 'text-sm lg:text-lg md:text-lg',
)

onMounted(() => {
  store.fetchGlobalConfig()
})
</script>

<template>
  <section
    id="profil-sekolah"
    class="px-6 py-16 scroll-mt-5 sm:px-8 lg:scroll-m-4 md:px-12 lg:py-32"
  >
    <div
      class="flex flex-col justify-center items-start gap-10 sm:gap-12 lg:flex-row lg:items-center lg:gap-16"
    >
      <div class="w-full flex flex-col max-w-160 lg:w-fit lg:flex-1">
        <div
          class="flex items-center gap-2 text-primary font-bold text-base mb-2 sm:text-lg md:mb-2"
        >
          <RiSchoolFill class="w-5 h-5 shrink-0 sm:w-6 sm:h-6" />
          <span>{{ motto }}</span>
        </div>

        <h2 class="font-extrabold text-3xl text-text-neutral mb-4 sm:text-4xl lg:text-5xl lg:mb-8">
          {{ title }}
        </h2>

        <!-- Mengganti v-html dengan komponen RichTextContent -->
        <RichTextContent
          :content="profileDesc"
          empty-message="Deskripsi profil sekolah belum diisi."
          :class="descTextSize"
        />
      </div>

      <div class="flex flex-col gap-4" :class="imageContainerClass">
        <img
          v-if="img1"
          :src="img1"
          alt="Profil Sekolah 1"
          class="w-full aspect-video object-cover rounded-2xl shadow-md transition-all duration-300 sm:flex-1 sm:min-w-0 lg:flex-none lg:w-full"
        />

        <img
          v-if="img2"
          :src="img2"
          alt="Profil Sekolah 2"
          class="w-full aspect-video object-cover rounded-2xl shadow-md transition-all duration-300 sm:flex-1 sm:min-w-0 lg:flex-none lg:w-full"
        />
      </div>
    </div>
  </section>
</template>
