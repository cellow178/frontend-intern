<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
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
    isLoading?: boolean
  }>(),
  {
    pageSize: undefined,
    pageSizeOptions: () => ['10', '20', '50'],
    totalData: undefined,
    itemCount: undefined,
    isLoading: false,
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

const showNav = computed(() => Number(props.totalPage) > 1)
const showAdminExtras = computed(() => props.pageSize !== undefined)

const wrapperClass = computed(() => {
  if (showNav.value && showAdminExtras.value) return 'lg:flex-row lg:justify-between'
  if (showAdminExtras.value) return 'lg:flex-row lg:justify-end'
  return 'lg:flex-row lg:justify-center'
})

const setPage = (page: number) => {
  const targetPage = Number(page)
  const current = Number(props.currentPage)
  const total = Number(props.totalPage)

  if (targetPage >= 1 && targetPage <= total) {
    if (targetPage !== current) {
      emit('update:currentPage', targetPage)
    } else {
      inputPage.value = current
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

const handleBlur = () => {
  inputPage.value = props.currentPage
}

const handlePageSizeChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:pageSize', value)
}
</script>

<template>
  <div
    v-if="showNav || showAdminExtras"
    class="w-full flex flex-col gap-2.5 sm:gap-3 lg:items-center"
    :class="wrapperClass"
  >
    <!-- Navigasi halaman -->
    <div v-if="showNav" class="flex items-center justify-center self-center gap-1 min-[400px]:gap-1.5 sm:gap-2 w-full sm:w-auto max-w-full flex-nowrap">
      <!-- Halaman Pertama -->
      <button
        type="button"
        :disabled="Number(currentPage) <= 1 || isLoading"
        title="Halaman Pertama"
        aria-label="Halaman Pertama"
        class="flex p-2 sm:p-2.5 min-h-9 min-w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 items-center justify-center touch-manipulation"
        @click="setPage(1)"
      >
        <RiSkipLeftLine class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      <!-- Halaman Sebelumnya -->
      <button
        type="button"
        :disabled="Number(currentPage) <= 1 || isLoading"
        title="Sebelumnya"
        aria-label="Halaman sebelumnya"
        class="flex items-center justify-center gap-1.5 px-2 min-[400px]:px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-9 min-w-9 sm:min-h-10 sm:min-w-10 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 touch-manipulation"
        @click="setPage(Number(currentPage) - 1)"
      >
        <RiArrowLeftSLine class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span class="hidden sm:inline text-sm font-semibold whitespace-nowrap">Sebelumnya</span>
      </button>

      <!-- Input Halaman -->
      <div
        class="flex items-center gap-1 min-[400px]:gap-1.5 px-1 sm:px-1.5 py-1 bg-neutral rounded-xl shadow-inner border border-secondary/80 shrink-0 min-w-0"
      >
        <input
          v-model.number="inputPage"
          type="number"
          inputmode="numeric"
          min="1"
          :max="totalPage"
          :disabled="isLoading"
          aria-label="Nomor halaman"
          class="w-9 min-[400px]:w-10 h-8 sm:w-12 text-center text-xs sm:text-sm font-bold text-text-neutral bg-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-neutral transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          @change="handleInputChange"
          @keyup.enter="handleInputChange"
          @blur="handleBlur"
        />
        <span class="text-xs sm:text-sm text-text-alt font-medium pr-1 whitespace-nowrap"
          >/ {{ totalPage }}</span
        >
      </div>

      <!-- Halaman Selanjutnya -->
      <button
        type="button"
        :disabled="Number(currentPage) >= Number(totalPage) || isLoading"
        title="Selanjutnya"
        aria-label="Halaman selanjutnya"
        class="flex items-center justify-center gap-1.5 px-2 min-[400px]:px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-9 min-w-9 sm:min-h-10 sm:min-w-10 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 touch-manipulation"
        @click="setPage(Number(currentPage) + 1)"
      >
        <span class="hidden sm:inline text-sm font-semibold whitespace-nowrap">Selanjutnya</span>
        <RiArrowRightSLine class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      </button>

      <!-- Halaman Terakhir -->
      <button
        type="button"
        :disabled="Number(currentPage) >= Number(totalPage) || isLoading"
        title="Halaman Terakhir"
        aria-label="Halaman terakhir"
        class="flex p-2 sm:p-2.5 min-h-9 min-w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-neutral text-text-neutral shadow-sm border border-secondary/80 hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 items-center justify-center touch-manipulation"
        @click="setPage(totalPage)"
      >
        <RiSkipRightLine class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>

    <!-- Page size + info total (selalu menempel kanan) -->
    <div
      v-if="showAdminExtras"
      class="w-fit max-w-full self-end sm:self-end lg:self-auto lg:ml-auto flex items-center justify-end gap-2 bg-neutral px-2 py-1.5 rounded-xl shadow-sm border border-secondary/80 min-w-0"
    >
      <select
        :value="pageSize"
        aria-label="Jumlah data per halaman"
        @change="handlePageSizeChange"
        class="border border-secondary bg-neutral text-text-neutral rounded-lg px-2 py-1.5 min-h-9 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shrink-0 touch-manipulation"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} / page</option>
      </select>
      <span
        v-if="totalData !== undefined"
        class="text-[11px] sm:text-xs font-medium text-text-alt text-right leading-tight min-w-0 pr-1 inline-flex items-center gap-1.5 justify-end"
      >
        <LoadingSpinner v-if="isLoading" size="sm" />
        <span>
          Menampilkan: <strong class="text-text-neutral">{{ itemCount ?? 0 }}</strong> dari
          {{ totalData }} data
        </span>
      </span>
      <span v-else-if="isLoading" class="inline-flex items-center pr-1">
        <LoadingSpinner size="sm" />
      </span>
    </div>
  </div>
</template>
