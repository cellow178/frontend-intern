<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { RiSchoolFill } from '@remixicon/vue'

const store = useSiteDataStore()
const { motto, profile } = storeToRefs(store)

const title = computed(() => profile.value.title)
const profileDesc = computed(() => profile.value.description)
const img1 = computed(() => profile.value.img_1)
const img2 = computed(() => profile.value.img_2)

onMounted(() => {
  store.fetchGlobalConfig()
  console.log('full store:', store)
})
</script>

<template>
  <section id="profil" class="px-12 py-32 scroll-mt-5">
    <div class="flex justify-center items-center gap-16">
      <!-- Kolom Gambar -->
      <div class="flex flex-col gap-8">
        <img
          v-if="img1"
          :src="img1"
          class="aspect-video object-cover"
          :class="img2 ? 'w-104' : 'w-150'"
        />
        <img v-if="img2" :src="img2" class="w-104 aspect-video object-cover" />
      </div>

      <!-- Kolom Teks -->
      <div class="w-fit flex flex-col max-w-142">
        <div class="flex items-center gap-2 text-primary font-bold text-lg mb-2">
          <RiSchoolFill class="w-6 h-6" />
          <span>{{ motto }}</span>
        </div>

        <h2 class="font-extrabold text-5xl text-text-neutral mb-6">
          {{ title }}
        </h2>

        <p class="text-lg leading-relaxed whitespace-pre-line">
          {{ profileDesc }}
        </p>
      </div>
    </div>
  </section>
</template>
