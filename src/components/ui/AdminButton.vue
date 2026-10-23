<script setup lang="ts">
import type { Component } from 'vue'
import { RiLoader4Line } from '@remixicon/vue'

/**
 * AdminButton — tombol khusus area dashboard/admin.
 *
 * Beda dengan Button landing (besar, shadow kuat, responsif md):
 * - Ukuran kompak (xs / sm / md), tanpa lompatan ukuran di breakpoint.
 * - Shadow subtle, radius rounded-xl mengikuti input admin.
 * - Varian sesuai kebutuhan admin: primary (aksi utama),
 *   secondary (aksi pendamping: Batal, Import, Luluskan),
 *   danger (Hapus / konfirmasi destruktif), ghost (aksi teks/sebaris).
 * - `neutral` didukung sebagai alias `secondary` agar migrasi bertahap aman.
 * - Prop `loading` menampilkan spinner dan mengunci tombol.
 */
withDefaults(
  defineProps<{
    label: string
    iconLeft?: Component
    iconRight?: Component
    variant?: 'primary' | 'secondary' | 'neutral' | 'danger' | 'warning' | 'ghost'
    size?: 'xs' | 'sm' | 'md'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    iconLeft: undefined,
    iconRight: undefined,
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
  },
)

const sizeClasses: Record<string, string> = {
  xs: 'text-xs px-2.5 py-1.5 min-h-8 gap-1',
  sm: 'text-xs sm:text-sm px-3 py-1.5 min-h-9 gap-1.5',
  md: 'text-sm px-4 py-2 min-h-10 gap-2',
}

const iconSizeClasses: Record<string, string> = {
  xs: 'w-3.5 h-3.5 shrink-0',
  sm: 'w-4 h-4 shrink-0',
  md: 'w-4 h-4 shrink-0',
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-neutral hover:bg-primary/90 shadow-sm hover:shadow-md',
  secondary: 'bg-neutral text-text-neutral border border-secondary hover:bg-secondary/60 shadow-sm',
  neutral: 'bg-neutral text-text-neutral border border-secondary hover:bg-secondary/60 shadow-sm',
  danger: 'bg-error text-neutral hover:bg-error/90 shadow-sm hover:shadow-md',
  warning: 'bg-warning text-neutral hover:bg-warning/90 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-text-neutral hover:bg-secondary/60 shadow-none',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-semibold rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 whitespace-nowrap"
    :class="[sizeClasses[size], variantClasses[variant]]"
  >
    <RiLoader4Line v-if="loading" :class="[iconSizeClasses[size], 'animate-spin']" />
    <component :is="iconLeft" v-else-if="iconLeft" :class="iconSizeClasses[size]" />

    <span>{{ loading ? 'Memproses...' : label }}</span>

    <component :is="iconRight" v-if="iconRight && !loading" :class="iconSizeClasses[size]" />
  </button>
</template>
