<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import { RiCheckLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

const route = useRoute()
const router = useRouter()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const voterName = ref((route.query.name as string | undefined) || '')

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  // Halaman selesai tidak menyimpan sesi apa pun — aman dibuka ulang / di-back.
})

const nextVoter = () => {
  router.replace({ name: 'bilik' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <div
      class="relative flex flex-col overflow-hidden bg-linear-to-br from-primary to-accent px-6 sm:px-10 py-6 md:py-12 min-h-[30vh] md:min-h-screen md:w-1/2"
    >
      <div class="hidden md:flex relative z-10 flex-1 flex-col items-center justify-center text-center gap-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-neutral/95 flex items-center justify-center shadow-sm shrink-0">
            <img :src="logoImg" alt="" class="w-8 h-8 object-contain" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral leading-tight text-left max-w-xs">
            {{ schoolName }}
          </h1>
        </div>
        <div class="w-10 h-px bg-neutral/40" />
        <p class="text-neutral/85 text-base max-w-xs">
          Sesi ini sudah dikunci. Berikan laptop ke pemilih berikutnya.
        </p>
      </div>
      <p class="md:hidden relative z-10 text-neutral/85 text-sm italic text-center mt-4">
        Suara tercatat
      </p>
    </div>

    <div class="flex items-center justify-center bg-neutral px-6 sm:px-10 md:px-16 py-10 md:w-1/2 md:min-h-screen">
      <div class="w-full max-w-125">
        <div class="text-center flex flex-col items-center gap-3 py-8">
          <div class="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center">
            <RiCheckLine class="w-8 h-8" />
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-text-neutral">Suara Tercatat!</h2>
          <p class="text-sm text-text-alt">
            Terima kasih<span v-if="voterName">, {{ voterName }}</span>. Sesi ini sudah dikunci.
          </p>
          <Button label="Siap untuk Pemilih Berikutnya" class="mt-4 px-8 py-2.5 font-semibold justify-center" @click="nextVoter" />
        </div>
      </div>
    </div>
  </div>
</template>
