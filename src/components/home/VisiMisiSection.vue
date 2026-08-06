<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, computed, onMounted } from 'vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import MissionItem from '@/components/home/MissionItem.vue'
import HighlightCard from '@/components/cards/HighlightCard.vue'
import { RiGraduationCapFill, RiTrophyFill, RiCharacterRecognitionFill } from '@remixicon/vue'

interface Mission {
  id: number
  order: number
  content: string
}

const vision = ref('')
const missions = ref<Mission[]>([])

// susun ulang jadi berpasangan per baris: [1,4,2,5,3,6]
const orderedMissions = computed(() => {
  const half = Math.ceil(missions.value.length / 2)
  const left = missions.value.slice(0, half)
  const right = missions.value.slice(half)
  const result: Mission[] = []
  for (let i = 0; i < half; i++) {
    const leftItem = left[i]
    const rightItem = right[i]
    if (leftItem) result.push(leftItem)
    if (rightItem) result.push(rightItem)
  }
  return result
})

const fetchVisionMission = async () => {
  try {
    const response = await api.get('/no-auth/vision-mission')
    vision.value = response.data.data.vision
    missions.value = response.data.data.missions
  } catch (err) {
    console.error('Gagal ambil data vision-mission:', err)
  }
}

onMounted(() => {
  fetchVisionMission()
})
</script>

<template>
  <section class="px-12 py-16 flex flex-col gap-16">
    <!-- Visi -->
    <div class="flex flex-col items-center gap-6">
      <SectionTitle title="Visi" />
      <p class="text-2xl text-text-neutral">{{ vision }}</p>
    </div>

    <!-- Misi -->
    <div class="flex flex-col items-center gap-12">
      <SectionTitle title="Misi" />

      <div class="relative grid grid-cols-2 w-full max-w-6xl gap-x-24 gap-y-10">
        <!-- Garis pembatas -->
        <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-text-alt/30"></div>

        <MissionItem
          v-for="mission in orderedMissions"
          :key="mission.id"
          :order="mission.order"
          :content="mission.content"
          :class="mission.order % 2 !== 0 ? 'pr-12' : ''"
        />
      </div>
    </div>

    <!-- Statistik -->
    <div class="flex items-start justify-center gap-30">
      <HighlightCard
        :logo="RiGraduationCapFill"
        label="2.000+&#10;Siswa Akitf"
        description="Bergabung dalam lingkungan belajar yang positif"
      />

      <HighlightCard
        :logo="RiCharacterRecognitionFill"
        label="Akreditasi&#10;Sekolah"
        description="Memberikan kualitas pendidikan terbaik dengan standar unggulan"
      />

      <HighlightCard
        :logo="RiTrophyFill"
        label="100+&#10;Prestasi Siswa"
        description="Meraih berbagai penghargaan akademik dan non-akademik setiap tahunnya"
      />
    </div>
  </section>
</template>