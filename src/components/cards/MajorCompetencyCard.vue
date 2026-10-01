<script setup lang="ts">
import { computed } from 'vue'

export interface CompetencyItem {
  id?: number | string
  title?: string
  name?: string
  competency_name?: string
  description?: string
  summary?: string
}

const props = defineProps<{
  competency?: CompetencyItem
}>()

// Getter fleksibel untuk judul
const titleText = computed(() => {
  return (
    props.competency?.title || props.competency?.name || props.competency?.competency_name || ''
  )
})

// Getter fleksibel untuk deskripsi
const descriptionText = computed(() => {
  return props.competency?.description || props.competency?.summary || ''
})
</script>

<template>
  <!-- Tambahkan h-full, flex, flex-col, dan justify-between agar konten mengisi seluruh kartu secara merata -->
  <div
    class="bg-neutral rounded-2xl shadow-md p-6 md:p-8 flex flex-col justify-between items-center text-center h-full w-full"
  >
    <!-- Bagian Atas: Judul & Deskripsi -->
    <div class="flex flex-col items-center">
      <!-- Judul Kompetensi -->
      <h3 class="text-xl md:text-2xl font-bold text-primary mb-4 tracking-tight">
        {{ titleText }}
      </h3>

      <!-- Deskripsi Singkat -->
      <p class="text-text-neutral text-sm md:text-base leading-relaxed font-normal">
        {{ descriptionText }}
      </p>
    </div>
  </div>
</template>
