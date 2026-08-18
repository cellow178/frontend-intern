<script setup lang="ts">
import { ref, watch } from 'vue'
import { RiSkipLeftLine, RiSkipRightLine } from '@remixicon/vue'

const props = defineProps<{
  currentPage: number
  totalPage: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

const pageInput = ref<number | string>(props.currentPage)

const changePage = (page: number) => {
  if (page >= 1 && page <= props.totalPage && page !== props.currentPage) {
    emit('update:currentPage', page)
  } else {
    pageInput.value = props.currentPage
  }
}

const handlePageInputSubmit = () => {
  let targetPage = Number(pageInput.value)
  if (isNaN(targetPage) || targetPage < 1) {
    targetPage = 1
  } else if (targetPage > props.totalPage) {
    targetPage = props.totalPage
  }
  changePage(targetPage)
}

const goToPrevPage = () => changePage(props.currentPage - 1)
const goToNextPage = () => changePage(props.currentPage + 1)
const goToFirstPage = () => changePage(1)
const goToLastPage = () => changePage(props.totalPage)

// sinkronkan input manual kalau currentPage berubah dari luar (misal search reset ke 1)
watch(
  () => props.currentPage,
  (newPage) => {
    pageInput.value = newPage
  },
)
</script>

<template>
  <div v-if="totalPage > 1" class="flex items-center justify-center gap-4">
    <button
      @click="goToFirstPage"
      :disabled="currentPage === 1"
      class="text-text-neutral disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
    >
      <RiSkipLeftLine class="w-6 h-6" />
    </button>

    <button
      @click="goToPrevPage"
      :disabled="currentPage === 1"
      class="text-text-neutral font-medium disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
    >
      Sebelumnya
    </button>

    <div class="flex items-center gap-2">
      <input
        v-model="pageInput"
        type="number"
        min="1"
        :max="totalPage"
        @keyup.enter="handlePageInputSubmit"
        @blur="handlePageInputSubmit"
        class="w-14 h-10 text-center border border-text-alt/30 rounded-lg text-text-neutral focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span class="text-text-alt font-medium">/ {{ totalPage }}</span>
    </div>

    <button
      @click="goToNextPage"
      :disabled="currentPage === totalPage"
      class="text-text-neutral font-medium disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
    >
      Selanjutnya
    </button>

    <button
      @click="goToLastPage"
      :disabled="currentPage === totalPage"
      class="text-text-neutral disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:text-primary transition-colors cursor-pointer disabled:pointer-events-none"
    >
      <RiSkipRightLine class="w-6 h-6" />
    </button>
  </div>
</template>