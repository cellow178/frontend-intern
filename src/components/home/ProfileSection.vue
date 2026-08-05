<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import { RiSchoolFill } from '@remixicon/vue'

const motto =ref('')
const title = ref('')
const profileDesc = ref('')
const img1 = ref('')
const img2 = ref<string | null>(null)

const fetchProfile = async () => {
  try {
    const response = await api.get('/no-auth/global-config')
    motto.value = response.data.data.motto
    title.value = response.data.data.profile.title
    profileDesc.value = response.data.data.profile.description
    img1.value = response.data.data.profile.img_1
    img2.value = response.data.data.profile.img_2 ?? null
  } catch (err) {
    console.error('Gagal ambil data global config:', err)
  }
}

onMounted(() => {
  fetchProfile()
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
        <img
          v-if="img2"
          :src="img2"
          class="w-104 aspect-video object-cover"
        />
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