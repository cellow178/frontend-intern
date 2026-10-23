<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import { getFullFileUrl } from '@/utils/file'
import logoImg from '@/assets/logo.png'

interface BoothCandidate {
  id: number
  title: string
  description: string
  img_cover: string | { path?: string; url?: string; field_value?: string } | null
  order: number
}

// Konfirmasi coblos: tahan tombol 1,2 detik agar salah sentuh tidak
// langsung tercatat. Progress ringkas, batal otomatis bila dilepas awal.
const HOLD_MS = 1200

interface BilikSession {
  voterName: string
  votingTitle: string
  votingDesc: string
  candidates: BoothCandidate[]
  ballotToken: string
  votingId: number
}

const router = useRouter()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { schoolName } = storeToRefs(siteDataStore)

const session = ref<BilikSession | null>(null)
// Carousel 1 kandidat per halaman: index aktif + kandidat yang dipilih.
const activeIndex = ref(0)
const selectedId = ref<number | null>(null)
const isCasting = ref(false)
const holdProgress = ref(0)
let holdTimer: ReturnType<typeof setInterval> | null = null
let holdTargetId: number | null = null

// Object Find: field_value ("tmp/xxx.jpg") yang VALID; timestamp fixed agar tidak kedip.
// Route temp-file butuh NAMA FILE UTUH (termasuk ekstensi).
const BOOTH_IMG_TS = Date.now()
const candidateImgUrl = (img: BoothCandidate['img_cover']): string | null => {
  if (!img) return null
  const obj = typeof img === 'string' ? null : img
  const raw: unknown = obj ? (obj.field_value ?? obj.path ?? null) : img
  if (typeof raw !== 'string' || !raw || raw === 'x' || raw.trim() === '') return null
  const clean = raw.replace(/^\/+/, '')
  if (/^https?:\/\//.test(clean)) return clean
  const filename = clean.split('/').pop() ?? clean
  const ext = filename.match(/\.([^./]+)$/)?.[1] ?? 'jpg'
  return getFullFileUrl(`api/temp-file/${filename}/${BOOTH_IMG_TS}/${ext}`)
}

const sortedBoothCandidates = computed(() =>
  [...(session.value?.candidates ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
)
// Kandidat yang sedang ditampilkan (1 per halaman). Geser via tombol
// Sebelumnya/Berikutnya atau titik indikator.
const activeCandidate = computed(
  () => sortedBoothCandidates.value[Math.min(activeIndex.value, sortedBoothCandidates.value.length - 1)] ?? null,
)
const goToCandidate = (i: number) => {
  activeIndex.value = Math.max(0, Math.min(i, sortedBoothCandidates.value.length - 1))
}
const prevCandidate = () => goToCandidate(activeIndex.value - 1)
const nextCandidate = () => goToCandidate(activeIndex.value + 1)

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  try {
    const raw = sessionStorage.getItem('bilik_session')
    session.value = raw ? (JSON.parse(raw) as BilikSession) : null
  } catch {
    session.value = null
  }
  if (!session.value?.ballotToken) {
    // Tanpa sesi valid (buka URL langsung / back setelah selesai) → ke login.
    router.replace({ name: 'bilik' })
  }
})

// Mulai tahan tombol coblos: progress 0 -> 100 dalam HOLD_MS.
const startHold = (candidateId: number) => {
  if (!session.value || isCasting.value) return
  stopHold()
  holdTargetId = candidateId
  const startedAt = Date.now()
  holdTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt
    holdProgress.value = Math.min(100, Math.round((elapsed / HOLD_MS) * 100))
    if (elapsed >= HOLD_MS) {
      const id = holdTargetId
      stopHold()
      if (id !== null) void handleCast(id)
    }
  }, 30)
}
const stopHold = () => {
  if (holdTimer) {
    clearInterval(holdTimer)
    holdTimer = null
  }
  holdTargetId = null
  holdProgress.value = 0
}
// Coblos langsung kandidat yang sedang ditampilkan (per tombol coblos
// di tiap kandidat). Tanpa pilih-dulu-coblos-kemudian.
const handleCast = async (candidateId: number) => {
  if (!session.value || isCasting.value) return
  selectedId.value = candidateId
  isCasting.value = true
  try {
    // Retry aman: token sekali pakai, duplikat ditolak server (409/422),
    // jadi klik ulang saat wifi putus tidak jadi suara ganda.
    await api.post('/no-auth/booth/cast', {
      voting_id: session.value.votingId,
      ballot_token: session.value.ballotToken,
      candidate_id: candidateId,
    })
    // Sesi langsung dibuang — back tidak bisa membuka surat suara lagi.
    sessionStorage.removeItem('bilik_session')
    router.replace({ name: 'bilik-done', query: { name: session.value.voterName } })
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal mencatat suara.', 'error')
  } finally {
    isCasting.value = false
  }
}
</script>

<template>
  <!-- Full-bleed ala login page: kiri gradient (no urut + foto + nama),
    kanan putih (deskripsi + pilih + navigasi). Tanpa padding tepi,
    1 layar penuh tanpa scroll halaman. Panel kiri stretch penuh agar
    isinya bisa dead-center vertikal + horizontal. -->
  <div class="h-screen w-screen overflow-hidden flex flex-col md:flex-row md:items-stretch">
    <!-- Kiri: panel gradient identitas kandidat + info voting/pemilih -->
    <div
      v-if="session && activeCandidate"
      :key="`left-${activeCandidate.id}`"
      class="relative flex flex-row md:flex-col items-center justify-center gap-3 md:gap-5 overflow-hidden bg-linear-to-br from-primary to-accent px-4 py-3 md:py-8 md:w-1/2 shrink-0 md:min-h-0 md:h-full"
    >
      <div
        class="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-neutral/10 blur-2xl"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-neutral/10 blur-2xl"
      />
      <!-- Info voting + pemilih: paling atas panel (desktop saja),
        diberi jarak lega ke blok kandidat di bawahnya -->
      <div class="relative z-10 hidden md:block text-center max-w-full order-first shrink-0 mb-2 xl:mb-4">
        <h2 class="text-xl xl:text-2xl font-bold text-neutral truncate">{{ session.votingTitle }}</h2>
        <p class="text-sm text-neutral/80 truncate mt-1">
          Pemilih: <strong class="text-neutral">{{ session.voterName }}</strong>
        </p>
      </div>
      <span
        class="relative z-10 w-10 h-10 md:w-14 md:h-14 rounded-full bg-neutral/95 text-primary flex items-center justify-center text-lg md:text-2xl font-bold shadow-md shrink-0"
      >
        {{ activeCandidate.order }}
      </span>
      <img
        v-if="candidateImgUrl(activeCandidate.img_cover)"
        :src="candidateImgUrl(activeCandidate.img_cover)!"
        :alt="activeCandidate.title"
        class="relative z-10 w-16 h-16 md:w-80 md:h-80 md:max-w-80 md:max-h-80 rounded-2xl object-cover bg-neutral/20 shadow-lg ring-2 ring-neutral/60 shrink-0"
      />
      <div class="relative z-10 min-w-0 flex-1 md:flex-none text-left md:text-center">
        <p class="text-[11px] md:text-sm text-neutral/75 uppercase tracking-widest font-semibold">
          Kandidat {{ activeIndex + 1 }} dari {{ sortedBoothCandidates.length }}
        </p>
        <p class="font-bold text-neutral text-base md:text-2xl truncate md:whitespace-normal">
          {{ activeCandidate.title }}
        </p>
      </div>
    </div>

    <!-- Kanan: deskripsi + pilih + navigasi -->
    <div
      class="flex-1 min-h-0 flex items-center justify-center bg-neutral px-4 sm:px-8 md:px-10 py-4 md:py-8 md:w-1/2"
    >
      <div v-if="session && activeCandidate" class="w-full flex flex-col gap-3 min-h-0 h-full">
        <!-- Info voting + pemilih (mobile saja — desktop sudah di panel kiri) -->
        <div class="shrink-0 md:hidden">
          <h2 class="text-base font-bold text-primary truncate">{{ session.votingTitle }}</h2>
          <p class="text-[11px] text-text-alt truncate">
            Pemilih: <strong class="text-text-neutral">{{ session.voterName }}</strong>
          </p>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <RichTextContent :content="activeCandidate.description" empty-message="Belum ada deskripsi." compact />
        </div>
        <div class="shrink-0 flex flex-col gap-2">
          <!-- Tombol coblos TAHAN 1,2 dtk (anti salah sentuh): progress bar
            mengisi selama ditahan, lepas lebih awal = batal. -->
          <button
            type="button"
            :disabled="isCasting"
            class="relative w-full py-2.5 text-sm sm:text-base font-semibold rounded-xl overflow-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
            :class="isCasting ? 'bg-text-alt text-neutral' : 'bg-primary text-neutral'"
            @pointerdown="startHold(activeCandidate.id)"
            @pointerup="stopHold"
            @pointerleave="stopHold"
            @pointercancel="stopHold"
            @contextmenu.prevent
          >
            <span
              class="absolute inset-y-0 left-0 bg-black/25 transition-none"
              :style="{ width: holdProgress + '%' }"
            />
            <span class="relative z-10">
              {{ isCasting ? 'Mencatat...' : holdProgress > 0 ? `Tahan... ${holdProgress}%` : `Tahan untuk Pilih ${activeCandidate.title}` }}
            </span>
          </button>
          <div class="flex items-center justify-between gap-2 sm:gap-3">
            <Button
              label="Sebelumnya"
              variant="secondary"
              size="md"
              :disabled="isCasting || activeIndex <= 0"
              class="flex-1 py-2.5 font-semibold justify-center"
              @click="prevCandidate"
            />
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-for="(_, i) in sortedBoothCandidates"
                :key="i"
                type="button"
                :aria-label="`Ke kandidat ${i + 1}`"
                class="h-2.5 rounded-full transition-all cursor-pointer"
                :class="i === activeIndex ? 'w-6 bg-primary' : 'w-2.5 bg-text-alt/30 hover:bg-text-alt/50'"
                @click="goToCandidate(i)"
              />
            </div>
            <Button
              label="Berikutnya"
              variant="secondary"
              :disabled="isCasting || activeIndex >= sortedBoothCandidates.length - 1"
              class="flex-1 py-2.5 font-semibold justify-center"
              @click="nextCandidate"
            />
          </div>
        </div>
      </div>
      <div v-else class="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Memuat surat suara..." />
      </div>
    </div>
  </div>
  <LoadingSpinner v-if="isCasting" :overlay="true" size="lg" label="Mencatat suara..." />
</template>
