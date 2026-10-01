<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MajorCompetencyCard from '@/components/cards/MajorCompetencyCard.vue'
import MajorGalleryCard from '@/components/cards/MajorGalleryCard.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { getFullFileUrl } from '@/utils/file'
import MajorDetailSkeleton from '@/components/skeletons/MajorDetailSkeleton.vue'

// Import Icon Komponen dari @remixicon/vue
import { RiImageLine, RiDoorOpenLine, RiBriefcaseLine } from '@remixicon/vue'

const route = useRoute()

const loading = ref(true)
const majorData = ref<any>(null)

const heroImgError = ref(false)
const secondImgError = ref(false)
const logoImgError = ref(false)

// Menggunakan getFullFileUrl secara langsung
const logoImage = computed(() => getFullFileUrl(majorData.value?.img_logo))

// Gambar Utama Hero
const heroImage = computed(() => {
  const galleries = majorData.value?.galleries
  if (galleries && galleries.length > 0 && galleries[0]?.img_cover) {
    return getFullFileUrl(galleries[0].img_cover)
  }
  return getFullFileUrl(majorData.value?.img_cover) || getFullFileUrl(majorData.value?.img_logo)
})

// Gambar Galeri Kedua
const secondGalleryImage = computed(() => {
  const galleries = majorData.value?.galleries
  if (galleries && galleries.length > 1 && galleries[1]?.img_cover) {
    return getFullFileUrl(galleries[1].img_cover)
  }
  return null
})

// Validasi Data
const hasGalleries = computed(() => {
  return Array.isArray(majorData.value?.galleries) && majorData.value.galleries.length > 0
})

const isUsingLogo = computed(() => {
  const galleries = majorData.value?.galleries
  const hasGalleryImg = galleries && galleries.length > 0 && galleries[0]?.img_cover
  const hasCoverImg = majorData.value?.img_cover

  // Jika tidak ada gambar galeri maupun gambar cover, maka yang dipakai adalah logo
  return !hasGalleryImg && !hasCoverImg
})

const hasCompetencies = computed(() => {
  return Array.isArray(majorData.value?.competencies) && majorData.value.competencies.length > 0
})

const resetImageErrors = () => {
  heroImgError.value = false
  secondImgError.value = false
  logoImgError.value = false
}

// Fetch Data Detail Jurusan
const fetchMajorDetail = async () => {
  loading.value = true
  resetImageErrors()
  const slug = route.params.slug || 'sistem-informasi-jaringan-dan-aplikasi'

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
    const response = await fetch(`${apiBaseUrl}/no-auth/majors/${slug}`)
    const result = await response.json()
    if (result.success) {
      majorData.value = result.data
    } else {
      majorData.value = null
    }
  } catch (error) {
    console.error('Error fetching major detail:', error)
    majorData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.slug) {
    fetchMajorDetail()
  }
})

watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) fetchMajorDetail()
  },
)
</script>

<template>
  <main class="pt-24 pb-16 px-6 lg:px-12 min-h-screen bg-neutral text-text-neutral tracking-normal">
    <BackButton class="mb-6 sm:mb-8" />

    <!-- Skeleton State -->
    <MajorDetailSkeleton v-if="loading" />

    <!-- Main Content Utama -->
    <div v-else class="max-w-6xl mx-auto">
      <div class="max-w-6xl mx-auto">
        <!-- State Data Kosong -->
        <div v-if="!majorData" class="min-h-[50vh] flex items-center justify-center">
          <p class="text-text-alt font-medium text-base">Data jurusan tidak ditemukan.</p>
        </div>

        <!-- Main Content Utama -->
        <div v-else>
          <!-- HERO SECTION (Header & Gambar Utama) -->
          <section
            class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center mb-12 md:mb-16 lg:mb-20"
          >
            <!-- Gambar Utama Hero -->
            <div class="md:col-span-5 flex justify-center">
              <div
                class="rounded-2xl md:rounded-3xl overflow-hidden bg-text-alt/20 shadow-sm border border-secondary flex items-center justify-center transition-all duration-300"
                :class="[
                  isUsingLogo
                    ? 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 aspect-square p-6 bg-white/50'
                    : 'w-full h-56 sm:h-64 md:h-72 lg:h-80',
                ]"
              >
                <img
                  v-if="heroImage && !heroImgError"
                  :src="heroImage"
                  :alt="majorData.major_name"
                  class="w-full h-full"
                  :class="isUsingLogo ? 'object-contain' : 'object-cover'"
                  @error="heroImgError = true"
                />
                <div
                  v-else
                  class="flex flex-col items-center justify-center text-text-alt p-6 text-center"
                >
                  <RiImageLine class="w-10 h-10 md:w-12 md:h-12 mb-2" />
                  <span class="text-xs font-medium tracking-wide">Gambar tidak tersedia</span>
                </div>
              </div>
            </div>

            <!-- Judul & Ringkasan Jurusan -->
            <div class="md:col-span-7 flex flex-col justify-center">
              <!-- Logo Jurusan & Kode Jurusan -->
              <div class="flex items-center space-x-2.5 mb-2.5 sm:mb-3">
                <img
                  v-if="logoImage && !logoImgError"
                  :src="logoImage"
                  :alt="majorData.code"
                  class="w-8 h-8 md:w-9 md:h-9 object-contain rounded-full"
                  @error="logoImgError = true"
                />
                <span v-else class="w-3.5 h-3.5 rounded-full bg-primary inline-block"></span>

                <span
                  class="font-extrabold text-text-alt tracking-wider text-lg md:text-2xl lg:text-3xl uppercase"
                >
                  {{ majorData.code }}
                </span>
              </div>

              <h1
                class="text-2xl md:text-3xl lg:text-4xl font-black text-text-neutral leading-tight mb-3 md:mb-4 tracking-tight"
              >
                {{ majorData.major_name }}
              </h1>
              <p class="text-text-alt text-sm md:text-base leading-relaxed font-normal">
                {{ majorData.summary }}
              </p>
            </div>
          </section>

          <!-- DESKRIPSI LENGKAP & GAMBAR KEDUA -->
          <section
            class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start mb-12 md:mb-16 lg:mb-24"
          >
            <!-- RichTextContent untuk Deskripsi Lengkap -->
            <div :class="secondGalleryImage ? 'md:col-span-7' : 'md:col-span-12'">
              <RichTextContent :content="majorData.full_description" />
            </div>

            <!-- Gambar Kedua (Galleries[1]) -->
            <div v-if="secondGalleryImage" class="md:col-span-5">
              <div
                class="rounded-2xl md:rounded-3xl overflow-hidden bg-text-alt/20 h-56 sm:h-64 md:h-72 lg:h-80 shadow-sm border border-secondary flex items-center justify-center md:sticky md:top-28"
              >
                <img
                  v-if="!secondImgError"
                  :src="secondGalleryImage"
                  :alt="majorData.major_name"
                  class="w-full h-full object-cover"
                  @error="secondImgError = true"
                />
                <div
                  v-else
                  class="flex flex-col items-center justify-center text-text-alt p-6 text-center"
                >
                  <RiImageLine class="w-8 h-8 md:w-10 md:h-10 mb-2" />
                  <span class="text-xs font-medium tracking-wide">Gambar tidak tersedia</span>
                </div>
              </div>
            </div>
          </section>

          <!-- STATISTIK KELAS & DURASI STUDI -->
          <section class="mb-12 md:mb-16 lg:mb-24">
            <div class="grid grid-cols-2 gap-4 md:gap-6 max-w-xl md:max-w-2xl mx-auto">
              <div
                class="rounded-2xl md:rounded-3xl p-4 md:p-6 bg-secondary/50 text-center flex flex-col items-center justify-center"
              >
                <div class="text-primary mb-2">
                  <RiDoorOpenLine class="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div class="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                  {{ majorData.total_classes }} Indeks
                </div>
                <div class="text-xs md:text-sm text-text-alt font-semibold mt-1">Total Kelas</div>
              </div>

              <div
                class="rounded-2xl md:rounded-3xl p-4 md:p-6 bg-secondary/50 text-center flex flex-col items-center justify-center"
              >
                <div class="text-primary mb-2">
                  <RiBriefcaseLine class="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div class="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                  {{ majorData.major_duration }} Tahun
                </div>
                <div class="text-xs md:text-sm text-text-alt font-semibold mt-1">Program Studi</div>
              </div>
            </div>
          </section>

          <!-- SECTION: KOMPETENSI JURUSAN -->
          <section
            v-if="hasCompetencies"
            class="mb-12 md:mb-16 lg:mb-24 flex flex-col gap-6 md:gap-8 lg:gap-10"
          >
            <div class="flex flex-col items-center gap-2">
              <h2
                class="font-black text-2xl md:text-3xl lg:text-4xl text-text-neutral text-center tracking-tight"
              >
                Kompetensi Jurusan
              </h2>
              <div class="w-16 md:w-20 h-1 bg-primary rounded-full"></div>
            </div>

            <!-- Grid Kompetensi: 2 Kolom di Tablet (md) agar tidak terlalu sempit -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch"
            >
              <div v-for="item in majorData.competencies" :key="item.id" class="flex flex-col">
                <MajorCompetencyCard :competency="item" class="h-full" />
              </div>
            </div>
          </section>

          <!-- SECTION: GALERI JURUSAN -->
          <section v-if="hasGalleries" class="mb-8 md:mb-12">
            <div class="flex flex-col items-center gap-2 mb-6 md:mb-8">
              <h2
                class="font-black text-2xl md:text-3xl lg:text-4xl text-text-neutral text-center tracking-tight"
              >
                Galeri Jurusan
              </h2>
              <div class="w-16 md:w-20 h-1 bg-primary rounded-full"></div>
            </div>

            <div class="max-w-4xl mx-auto">
              <MajorGalleryCard
                :galleries="majorData.galleries"
                :code="majorData.code"
                :logo="majorData.img_logo"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>
