<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSkipLeftLine,
  RiSkipRightLine,
} from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPage: number
    pageSize?: string
    pageSizeOptions?: string[]
    totalData?: number
    itemCount?: number
  }>(),
  {
    pageSize: undefined,
    pageSizeOptions: () => ['10', '20', '50'],
    totalData: undefined,
    itemCount: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: string): void
}>()

const inputPage = ref<number | string>(props.currentPage)

watch(
  () => props.currentPage,
  (newPage) => {
    inputPage.value = newPage
  },
  { immediate: true },
)

const setPage = (page: number) => {
  const targetPage = Number(page)
  const current = Number(props.currentPage)
  const total = Number(props.totalPage)

  if (targetPage >= 1 && targetPage <= total) {
    if (targetPage !== current) {
      emit('update:currentPage', targetPage)
    }
  } else {
    inputPage.value = props.currentPage
  }
}

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10)

  if (!isNaN(value)) {
    if (value < 1) {
      setPage(1)
    } else if (value > props.totalPage) {
      setPage(props.totalPage)
    } else {
      setPage(value)
    }
  } else {
    inputPage.value = props.currentPage
  }
}

const handlePageSizeChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:pageSize', value)
}

const showAdminExtras = props.pageSize !== undefined
</script>

<template>
  <div
    v-if="totalPage > 1 || showAdminExtras"
    class="w-full flex flex-col lg:flex-row items-center gap-3"
    :class="showAdminExtras ? 'lg:justify-between' : 'lg:justify-center'"
  >
    <!-- Navigasi halaman -->
    <div v-if="totalPage > 1" class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
      <!-- Halaman Pertama -->
      <button
        type="button"
        :disabled="Number(currentPage) <= 1"
        title="Halaman Pertama"
        class="p-2.5 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 flex items-center justify-center"
        @click="setPage(1)"
      >
        <RiSkipLeftLine class="w-4 h-4" />
      </button>

      <!-- Halaman Sebelumnya -->
      <button
        type="button"
        :disabled="Number(currentPage) <= 1"
        title="Sebelumnya"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
        @click="setPage(Number(currentPage) - 1)"
      >
        <RiArrowLeftSLine class="w-4 h-4" />
        <span class="hidden sm:inline text-sm font-semibold">Sebelumnya</span>
      </button>

      <!-- Input Halaman -->
      <div
        class="flex items-center gap-1.5 px-1.5 py-1 bg-neutral rounded-xl shadow-inner border border-secondary/80"
      >
        <input
          v-model.number="inputPage"
          type="number"
          min="1"
          :max="totalPage"
          class="w-10 h-8 sm:w-12 sm:h-8 text-center text-xs sm:text-sm font-bold text-text-neutral bg-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-neutral transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          @change="handleInputChange"
          @keyup.enter="handleInputChange"
        />
        <span class="text-xs sm:text-sm text-text-alt font-medium pr-1">/ {{ totalPage }}</span>
      </div>

      <!-- Halaman Selanjutnya -->
      <button
        type="button"
        :disabled="Number(currentPage) >= Number(totalPage)"
        title="Selanjutnya"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
        @click="setPage(Number(currentPage) + 1)"
      >
        <span class="hidden sm:inline text-sm font-semibold">Selanjutnya</span>
        <RiArrowRightSLine class="w-4 h-4" />
      </button>

      <!-- Halaman Terakhir -->
      <button
        type="button"
        :disabled="Number(currentPage) >= Number(totalPage)"
        title="Halaman Terakhir"
        class="p-2.5 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 flex items-center justify-center"
        @click="setPage(totalPage)"
      >
        <RiSkipRightLine class="w-4 h-4" />
      </button>
    </div>

    <!-- Page size + info total -->
    <div
      v-if="showAdminExtras"
      class="flex flex-wrap items-center justify-center gap-3 bg-neutral p-1.5 rounded-xl shadow-sm border border-secondary/80"
    >
      <select
        :value="pageSize"
        @change="handlePageSizeChange"
        class="border border-secondary bg-neutral text-text-neutral rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} / page</option>
      </select>
      <span
        v-if="totalData !== undefined"
        class="text-xs font-medium text-text-alt whitespace-nowrap pr-2"
      >
        Menampilkan: <strong class="text-text-neutral">{{ itemCount ?? 0 }}</strong> dari
        {{ totalData }} data
      </span>
    </div>
  </div>
</template>
