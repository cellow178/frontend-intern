<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import Button from '@/components/ui/Button.vue'
import BackButton from '@/components/ui/BackButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import { getFullFileUrl } from '@/utils/file'
import { RiCheckLine, RiArrowDownSLine, RiCloseLine } from '@remixicon/vue'
import logoImg from '@/assets/logo.png'

interface RemoteCandidate {
  id: number
  title: string
  description: string
  img_cover: string | { path?: string; url?: string; field_value?: string } | null
  order: number
}

// Halaman surat suara Jarak Jauh (route sendiri seperti bilik TPS agar
// tombol back tidak kembali ke daftar, melainkan ke halaman selesai / login
// dan sesi langsung dibuang setelah coblos).
const REMOTE_IMG_TS = Date.now()
const remoteImgUrl = (img: RemoteCandidate['img_cover']): string | null => {
  if (!img) return null
  const obj = typeof img === 'string' ? null : img
  const raw: unknown = obj ? (obj.field_value ?? obj.path ?? null) : img
  if (typeof raw !== 'string' || !raw || raw === 'x' || raw.trim() === '') return null
  const clean = raw.replace(/^\/+/, '')
  if (/^https?:\/\//.test(clean)) return clean
  const filename = clean.split('/').pop() ?? clean
  const ext = filename.match(/\.([^./]+)$/)?.[1] ?? 'jpg'
  return getFullFileUrl(`api/temp-file/${filename}/${REMOTE_IMG_TS}/${ext}`)
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { user } = storeToRefs(authStore)
const { schoolName } = storeToRefs(siteDataStore)

const votingId = computed(() => Number(route.params.votingId))
const votingTitle = ref('')
const votingDesc = ref('')
const openError = ref('')
const isOpening = ref(false)
const ballotToken = ref('')
const candidates = ref<RemoteCandidate[]>([])
const isCasting = ref(false)
const done = ref(false)

const sortedRemoteCandidates = computed(() =>
  [...candidates.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
)
// Remote santai: semua kandidat tampil sekaligus sebagai kartu.
// Deskripsi diringkas + bisa dibuka penuh (dropdown) bila kurang jelas.
const expandedId = ref<number | null>(null)
const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

// Track konten deskripsi yang benar-benar meluap (lebih tinggi dari
// batas ringkas) agar tombol dropdown hanya muncul bila dibutuhkan.
// Diukur setelah render via nextTick + saat resize (font/gambar telat muat).
const overflowingIds = ref<Set<number>>(new Set())
const descRefs = ref<Record<number, HTMLElement | null>>({})
const COLLAPSED_PX = 96 // = max-h-24 ringkas
const measureOverflows = () => {
  const next = new Set<number>()
  for (const [id, el] of Object.entries(descRefs.value)) {
    const nId = Number(id)
    if (!el || expandedId.value === nId) continue
    // scrollHeight > clientHeight + toleransi 2px = ada konten terpotong.
    if (el.scrollHeight > el.clientHeight + 2) next.add(nId)
  }
  overflowingIds.value = next
}
const setDescRef = (id: number) => (el: unknown) => {
  descRefs.value[id] = el as HTMLElement | null
}

// Remote tanpa token: langsung minta ballot token saat halaman dibuka.
// Keamanan mengandalkan akun login + cek DPT di backend.
const openBallot = async () => {
  openError.value = ''
  isOpening.value = true
  try {
    const response = await api.post('/booth/remote-login', {
      voting_id: votingId.value,
    })
    ballotToken.value = response.data?.data?.ballot_token
    candidates.value = response.data?.data?.candidates ?? []
    votingTitle.value = response.data?.data?.voting?.title ?? ''
    votingDesc.value = response.data?.data?.voting?.description ?? ''
  } catch (err: any) {
    openError.value = err.response?.data?.message || 'Gagal membuka ruang voting.'
  } finally {
    isOpening.value = false
  }
}

// Tombol Pilih TAHAN 1,2 dtk (anti klik tidak sengaja): progress bar
// mengisi selama ditahan, lepas lebih awal = batal. Satu timer untuk
// semua kartu (hanya 1 tombol yang bisa ditahan dalam satu waktu).
const HOLD_MS = 1200
const holdProgress = ref(0)
// Harus ref (bukan let biasa) agar template v-if progress ikut reaktif.
const holdTargetId = ref<number | null>(null)
let holdTimer: ReturnType<typeof setInterval> | null = null
const startHold = (candidateId: number) => {
  if (isCasting.value) return
  stopHold()
  holdTargetId.value = candidateId
  const startedAt = Date.now()
  holdTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt
    holdProgress.value = Math.min(100, Math.round((elapsed / HOLD_MS) * 100))
    if (elapsed >= HOLD_MS) {
      const id = holdTargetId.value
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
  holdTargetId.value = null
  holdProgress.value = 0
}

const handleCast = async (candidateId: number) => {
  if (isCasting.value) return
  isCasting.value = true
  try {
    await api.post('/no-auth/booth/cast', {
      voting_id: votingId.value,
      ballot_token: ballotToken.value,
      candidate_id: candidateId,
    })
    done.value = true
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Gagal mencatat suara.', 'error')
  } finally {
    isCasting.value = false
  }
}

const backToList = () => router.push({ name: 'voting-saya' })

// Lightbox foto kandidat: klik gambar untuk perbesar, klik backdrop / tombol
// tutup / tombol Escape untuk kembali. Scroll halaman dikunci saat terbuka.
const lightboxSrc = ref<string | null>(null)
const lightboxAlt = ref('')
const openLightbox = (src: string | null, alt: string) => {
  if (!src) return
  lightboxSrc.value = src
  lightboxAlt.value = alt
  document.body.style.overflow = 'hidden'
}
const closeLightbox = () => {
  lightboxSrc.value = null
  document.body.style.overflow = ''
}
const handleLightboxKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeLightbox()
}
watch(lightboxSrc, (v) => {
  if (v) window.addEventListener('keydown', handleLightboxKey)
  else window.removeEventListener('keydown', handleLightboxKey)
})

// Ukur ulang luapan setiap kandidat selesai dimuat / expanded berubah.
watch([candidates, expandedId], () => {
  void nextTick(() => {
    // Dua frame: tunggu gambar dalam deskripsi selesai layout.
    requestAnimationFrame(() => requestAnimationFrame(measureOverflows))
  })
})

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  if (!votingId.value) {
    backToList()
    return
  }
  void openBallot()
  window.addEventListener('resize', measureOverflows)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureOverflows)
})
</script>

<template>
  <!-- Remote santai: halaman scroll normal (bukan h-screen terkunci).
    Semua kandidat tampil sekaligus sebagai kartu; deskripsi diringkas
    + dropdown "Lihat visi lengkap" bila kurang jelas. Tanpa carousel,
    tanpa hold — cukup klik Pilih per kartu. -->
  <div class="min-h-screen flex flex-col bg-secondary/40">
    <div
      class="relative overflow-hidden bg-linear-to-br from-primary to-accent px-4 sm:px-8 pt-4 sm:pt-6 pb-14 sm:pb-16 shrink-0"
    >
      <div
        class="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-neutral/10 blur-2xl"
      />
      <div
        class="pointer-events-none absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-neutral/10 blur-2xl"
      />
      <div class="hidden md:block absolute top-4 sm:top-6 left-4 sm:left-8 z-20">
        <BackButton variant="white" to="/voting-saya" :sticky="false" />
      </div>
      <div class="relative z-10 mx-auto w-full max-w-3xl">
        <div class="flex items-center justify-between gap-2 md:hidden">
          <BackButton variant="white" to="/voting-saya" :sticky="false" />
          <p class="text-[11px] sm:text-xs text-neutral/80 truncate">
            {{ done ? 'Selesai' : `${user?.fullname || 'Pemilih'}` }}
          </p>
        </div>
        <div class="mt-4 sm:mt-6 text-center flex flex-col items-center">
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral leading-tight">
            {{ votingTitle || 'Ruang Voting' }}
          </h1>
          <p v-if="done" class="mt-1 text-xs sm:text-sm text-neutral/80">
            Terima kasih atas partisipasi Anda.
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 flex justify-center px-4 sm:px-8 pb-8 sm:pb-10">
      <div class="w-full max-w-6xl -mt-8 sm:-mt-10 relative z-10">
        <div
          v-if="isOpening"
          class="rounded-2xl bg-neutral shadow-sm p-6 flex justify-center py-10"
        >
          <LoadingSpinner size="md" label="Membuka ruang voting..." />
        </div>
        <div v-else-if="openError" class="rounded-2xl bg-neutral shadow-sm p-6 flex flex-col gap-2">
          <p class="text-xs text-error text-center">{{ openError }}</p>
          <Button
            label="Coba Lagi"
            class="w-full py-2.5 font-semibold justify-center"
            @click="openBallot"
          />
        </div>

        <!-- Surat suara: info voting + daftar kandidat -->
        <template v-else-if="ballotToken && !done">
          <!-- Info voting: kartu sendiri di atas daftar kandidat (tidak
          menumpuk header; aman untuk deskripsi panjang) -->
          <div
            v-if="votingDesc"
            class="rounded-2xl bg-neutral shadow-sm border border-secondary/40 p-4 sm:p-5 mb-3 sm:mb-4"
          >
            <p class="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-text-alt">
              Tentang voting ini
            </p>
            <div class="mt-1 max-h-32 overflow-y-auto">
              <RichTextContent :content="votingDesc" empty-message="" compact />
            </div>
          </div>

          <!-- Semua kandidat sekaligus: grid auto-fill — tiap baris diisi
          kartu selebar >= 280px yang sama rata; kartu di baris terakhir
          tetap seukuran (tidak melar penuh). Mobile 1 kolom. -->
          <div
            class="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3 sm:gap-4"
          >
            <div
              v-for="c in sortedRemoteCandidates"
              :key="c.id"
              class="rounded-2xl bg-neutral shadow-sm border-2 p-5 sm:p-7 flex flex-col gap-4 transition-colors min-w-0"
              :class="expandedId === c.id ? 'border-primary' : 'border-transparent'"
            >
              <!-- Header kartu: no urut + gambar sebaris (mobile) / kolom (desktop),
              nama selalu di bawah gambar -->
              <div class="flex flex-col items-center gap-3 sm:gap-4 w-full">
                <span
                  class="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary text-neutral flex items-center justify-center text-base sm:text-xl font-bold shrink-0 shadow order-first"
                >
                  {{ c.order }}
                </span>
                <button
                  v-if="remoteImgUrl(c.img_cover)"
                  type="button"
                  class="relative shrink-0 cursor-zoom-in touch-manipulation group"
                  :aria-label="`Perbesar foto ${c.title}`"
                  @click="openLightbox(remoteImgUrl(c.img_cover), c.title)"
                >
                  <img
                    :src="remoteImgUrl(c.img_cover)!"
                    :alt="c.title"
                    class="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl object-cover bg-secondary/20"
                  />
                  <span
                    class="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-neutral text-[11px] font-semibold opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                  >
                    Perbesar
                  </span>
                </button>
                <div class="min-w-0 flex-1 md:flex-none text-left md:text-center">
                  <!-- Nama lengkap di bawah gambar, tidak di-truncate -->
                  <p class="font-bold text-text-neutral text-lg sm:text-xl leading-snug">
                    {{ c.title }}
                  </p>
                  <button
                    v-if="overflowingIds.has(c.id) || expandedId === c.id"
                    type="button"
                    class="mt-1 inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline cursor-pointer touch-manipulation"
                    @click="toggleExpand(c.id)"
                  >
                    {{ expandedId === c.id ? 'Tutup' : 'Selengkapnya' }}
                    <RiArrowDownSLine
                      class="w-4 h-4 transition-transform"
                      :class="expandedId === c.id ? 'rotate-180' : ''"
                    />
                  </button>
                </div>
              </div>
              <!-- Deskripsi: hanya konten yang meluap yang bisa dibuka penuh -->
              <div
                :ref="setDescRef(c.id)"
                class="w-full text-left overflow-hidden transition-all"
                :class="
                  expandedId === c.id ? 'max-h-128 overflow-y-auto' : 'max-h-24 overflow-hidden'
                "
              >
                <RichTextContent :content="c.description" empty-message="Belum ada visi." compact />
              </div>
              <button
                type="button"
                :disabled="isCasting"
                class="relative w-full py-3 text-base sm:text-lg font-semibold rounded-xl overflow-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg mt-auto"
                :class="isCasting ? 'bg-text-alt text-neutral' : 'bg-primary text-neutral'"
                @pointerdown="startHold(c.id)"
                @pointerup="stopHold"
                @pointerleave="stopHold"
                @pointercancel="stopHold"
                @contextmenu.prevent
              >
                <span
                  v-if="holdTargetId === c.id"
                  class="absolute inset-y-0 left-0 bg-black/25"
                  :style="{ width: holdProgress + '%' }"
                />
                <span class="relative z-10">
                  {{
                    isCasting
                      ? 'Mencatat...'
                      : holdTargetId === c.id && holdProgress > 0
                        ? `Tahan... ${holdProgress}%`
                        : `Pilih ${c.title}`
                  }}
                </span>
              </button>
              <p class="text-[11px] text-text-alt text-center -mt-1">Tahan untuk memilih.</p>
            </div>
          </div>
        </template>

        <!-- Selesai -->
        <div
          v-else-if="done"
          class="rounded-2xl bg-neutral shadow-sm text-center flex flex-col items-center gap-3 p-6 sm:p-8"
        >
          <div
            class="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center"
          >
            <RiCheckLine class="w-8 h-8" />
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-text-neutral">Suara Tercatat!</h2>
          <p class="text-sm text-text-alt">Terima kasih! Anda tetap login di akun ini.</p>
          <Button
            label="Kembali ke Daftar Voting"
            class="mt-2 w-full py-2.5 font-semibold justify-center"
            @click="backToList"
          />
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-if="isCasting" :overlay="true" size="lg" label="Mencatat suara..." />

  <!-- Lightbox foto kandidat -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="lightboxSrc"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
        @click="closeLightbox"
      >
        <button
          type="button"
          aria-label="Tutup foto"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-neutral/15 text-neutral flex items-center justify-center hover:bg-neutral/25 transition-colors cursor-pointer"
          @click="closeLightbox"
        >
          <RiCloseLine class="w-6 h-6" />
        </button>
        <img
          :src="lightboxSrc"
          :alt="lightboxAlt"
          class="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          @click.stop
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
