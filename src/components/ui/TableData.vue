<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DashboardIconButton from '@/components/ui/DashboardIconButton.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { RiSearchLine, RiAddLine } from '@remixicon/vue'

export interface Column {
  key: string
  label: string
  width?: string
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    items: Record<string, any>[]
    isLoading?: boolean
    emptyMessage?: string
    searchPlaceholder?: string
    showAddButton?: boolean
    addButtonLabel?: string
    showFilterButton?: boolean
    totalItems?: number
    totalPage?: number
    itemsPerPage?: number
    currentPage?: number
  }>(),
  {
    isLoading: false,
    emptyMessage: 'Tidak ada data ditemukan.',
    searchPlaceholder: 'Cari data...',
    showAddButton: true,
    addButtonLabel: 'Tambah Baru',
    showFilterButton: false,
    totalPage: 1,
    itemsPerPage: 10,
    currentPage: 1,
  },
)

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'update:currentPage', page: number): void
  (e: 'update:itemsPerPage', limit: number): void
  (e: 'reset-filters'): void // <- Event baru untuk kirim notifikasi reset
}>()

const searchQuery = defineModel<string>('search', { default: '' })
const isFilterOpen = ref(false)

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

// Reset filter saat panel filter ditutup oleh user
watch(isFilterOpen, (isOpen) => {
  if (!isOpen) {
    emit('reset-filters')
  }
})

const totalData = computed(() => props.totalItems ?? props.items.length)
</script>

<template>
  <div
    class="bg-neutral rounded-2xl shadow-sm border border-secondary/20 overflow-hidden p-4 flex flex-col gap-4 sm:gap-6"
  >
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        <!-- Search Input -->
        <div class="flex-1 max-w-md min-w-40 sm:min-w-48">
          <Input
            v-model="searchQuery"
            size="normal"
            type="text"
            :placeholder="searchPlaceholder"
            :icon="RiSearchLine"
          />
        </div>

        <!-- Filter Button Built-In -->
        <DashboardIconButton
          v-if="showFilterButton"
          variant="filter"
          label="Filter"
          :active="isFilterOpen"
          @click="toggleFilter"
        />

        <!-- Filter Form Slot -->
        <div
          v-if="showFilterButton && isFilterOpen"
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
        >
          <slot name="filters" />
        </div>

        <!-- Custom Toolbar Actions Slot -->
        <slot name="toolbar-actions" />
      </div>

      <!-- Add Button -->
      <Button
        v-if="showAddButton"
        :label="addButtonLabel"
        :icon-left="RiAddLine"
        size="sm"
        variant="primary"
        class="w-full sm:w-auto sm:ml-auto shrink-0 justify-center"
        @click="emit('add')"
      />
    </div>

    <!-- State Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-16 border-t border-secondary/30"
    >
      <LoadingSpinner size="lg" label="Memuat data..." />
    </div>

    <!-- State Empty -->
    <div
      v-else-if="items.length === 0"
      class="text-center text-text-alt py-12 border-t border-secondary/30"
    >
      {{ emptyMessage }}
    </div>

    <template v-else>
      <!-- View Desktop: Table -->
      <div class="hidden md:block overflow-x-auto border-t border-secondary/30">
        <table class="w-full text-sm">
          <thead class="bg-primary/20">
            <tr class="text-left text-text-alt font-semibold uppercase text-xs">
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3"
                :class="col.width ? col.width : ''"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in items"
              :key="item.id ?? idx"
              :class="idx % 2 === 0 ? 'bg-neutral' : 'bg-neutral'"
              class="border-b border-secondary/10 hover:bg-primary/20 transition-colors"
            >
              <td v-for="col in columns" :key="col.key" class="px-4 py-2.5 text-text-neutral">
                <slot :name="`col-${col.key}`" :item="item" :index="idx">
                  {{ item[col.key] ?? '-' }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- View Mobile: Custom Card Slot -->
      <div class="md:hidden flex flex-col gap-3 pt-2 border-t border-secondary/30">
        <div
          v-for="(item, idx) in items"
          :key="item.id ?? idx"
          :class="idx % 2 === 0 ? 'bg-secondary/20' : 'bg-neutral'"
          class="rounded-2xl border border-secondary/20 shadow-sm p-4 flex flex-col gap-3"
        >
          <slot name="mobile-card" :item="item" :index="idx">
            <div class="flex flex-col gap-1">
              <div v-for="col in columns" :key="col.key" class="text-sm">
                <span class="font-semibold text-text-alt">{{ col.label }}: </span>
                <span class="text-text-neutral">{{ item[col.key] }}</span>
              </div>
            </div>
          </slot>
        </div>
      </div>

      <!-- Footer Pagination -->
      <div class="pt-3 border-t border-secondary/20">
        <Pagination
          :current-page="currentPage"
          :total-page="totalPage"
          :page-size="String(itemsPerPage)"
          :total-data="totalData"
          :item-count="items.length"
          @update:current-page="emit('update:currentPage', $event)"
          @update:page-size="emit('update:itemsPerPage', Number($event))"
        />
      </div>
    </template>
  </div>
</template>
