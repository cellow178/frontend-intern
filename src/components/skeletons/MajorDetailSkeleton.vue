<template>
  <main class="animate-pulse">
    <div class="max-w-6xl mx-auto">
      <!-- 1. HERO SECTION SKELETON -->
      <section
        class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center mb-12 md:mb-16 lg:mb-20"
      >
        <!-- Hero Image Placeholder -->
        <div class="md:col-span-5 flex justify-center">
          <div
            class="w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-2xl md:rounded-3xl bg-text-alt/20 shadow-sm border border-secondary/50"
          ></div>
        </div>

        <!-- Major Fast Info / Header Placeholder -->
        <div class="md:col-span-7 flex flex-col justify-center space-y-3 md:space-y-4">
          <!-- Logo & Code Badge Placeholder -->
          <div class="flex items-center space-x-2.5 mb-1">
            <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-text-alt/20"></div>
            <div class="h-7 md:h-8 w-24 bg-text-alt/20 rounded-md"></div>
          </div>

          <!-- Major Title Placeholder -->
          <div class="h-8 sm:h-9 md:h-10 lg:h-12 w-4/5 bg-text-alt/20 rounded-xl"></div>

          <!-- Summary Line Placeholder -->
          <div class="space-y-2 pt-1">
            <div class="h-4 w-full bg-text-alt/20 rounded"></div>
            <div class="h-4 w-3/4 bg-text-alt/20 rounded"></div>
          </div>
        </div>
      </section>

      <!-- 2. DESKRIPSI LENGKAP & GAMBAR KEDUA SKELETON -->
      <section
        class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start mb-12 md:mb-16 lg:mb-24"
      >
        <!-- RichTextContent Lines Placeholder -->
        <div class="md:col-span-7 space-y-3">
          <div class="h-4 w-full bg-text-alt/20 rounded"></div>
          <div class="h-4 w-full bg-text-alt/20 rounded"></div>
          <div class="h-4 w-11/12 bg-text-alt/20 rounded"></div>
          <div class="h-4 w-4/5 bg-text-alt/20 rounded"></div>
          <div class="h-4 w-full bg-text-alt/20 rounded pt-3"></div>
          <div class="h-4 w-10/12 bg-text-alt/20 rounded"></div>
          <div class="h-4 w-3/4 bg-text-alt/20 rounded"></div>
        </div>

        <!-- Second Gallery Image Placeholder -->
        <div class="md:col-span-5">
          <div
            class="w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-2xl md:rounded-3xl bg-text-alt/20 shadow-sm border border-secondary/50"
          ></div>
        </div>
      </section>

      <!-- 3. STATISTIK KELAS & DURASI STUDI SKELETON -->
      <section class="mb-12 md:mb-16 lg:mb-24">
        <div class="grid grid-cols-2 gap-4 md:gap-6 max-w-xl md:max-w-2xl mx-auto">
          <!-- Total Kelas Card -->
          <div
            class="rounded-2xl md:rounded-3xl p-4 md:p-6 bg-secondary/30 h-28 md:h-32 flex flex-col items-center justify-center space-y-2"
          >
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-text-alt/20"></div>
            <div class="h-6 w-24 bg-text-alt/20 rounded-md"></div>
            <div class="h-3 w-16 bg-text-alt/20 rounded"></div>
          </div>

          <!-- Program Studi Card -->
          <div
            class="rounded-2xl md:rounded-3xl p-4 md:p-6 bg-secondary/30 h-28 md:h-32 flex flex-col items-center justify-center space-y-2"
          >
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-text-alt/20"></div>
            <div class="h-6 w-24 bg-text-alt/20 rounded-md"></div>
            <div class="h-3 w-20 bg-text-alt/20 rounded"></div>
          </div>
        </div>
      </section>

      <!-- 4. SECTION: KOMPETENSI JURUSAN SKELETON -->
      <section class="mb-12 md:mb-16 lg:mb-24 flex flex-col gap-6 md:gap-8 lg:gap-10">
        <!-- Title Center Placeholder -->
        <div class="flex flex-col items-center gap-2">
          <div class="h-8 md:h-9 w-56 bg-text-alt/20 rounded-lg"></div>
          <div class="w-16 md:w-20 h-1 bg-text-alt/20 rounded-full"></div>
        </div>

        <!-- Competency Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="bg-text-alt/10 rounded-2xl p-5 border border-secondary/50 space-y-3 flex flex-col justify-center items-center h-32"
          >
            <div class="h-5 w-32 bg-text-alt/20 rounded-md"></div>
            <div class="h-3.5 w-full bg-text-alt/20 rounded"></div>
            <div class="h-3.5 w-3/4 bg-text-alt/20 rounded"></div>
          </div>
        </div>
      </section>

      <!-- 5. SECTION: GALERI JURUSAN SKELETON -->
      <section class="mb-8 md:mb-12 flex flex-col gap-6 md:gap-8">
        <!-- Title Center Placeholder -->
        <div class="flex flex-col items-center gap-2">
          <div class="h-8 md:h-9 w-48 bg-text-alt/20 rounded-lg"></div>
          <div class="w-16 md:w-20 h-1 bg-text-alt/20 rounded-full"></div>
        </div>

        <!-- MajorGalleryCard Placeholder -->
        <div
          class="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 border border-secondary/50 max-w-4xl mx-auto space-y-4 w-full"
        >
          <!-- Frame Gambar Utama Carousel -->
          <div
            class="w-full h-56 sm:h-72 md:h-96 lg:h-105 rounded-xl sm:rounded-2xl bg-text-alt/20"
          ></div>

          <!-- Caption Text Placeholder -->
          <div class="h-4 w-2/3 bg-text-alt/20 rounded mx-auto my-2"></div>

          <!-- Indicator Dots Placeholder -->
          <div class="flex items-center justify-center gap-2 pt-2">
            <div class="h-2.5 w-7 bg-text-alt/30 rounded-full"></div>
            <div class="h-2.5 w-2.5 bg-text-alt/20 rounded-full"></div>
            <div class="h-2.5 w-2.5 bg-text-alt/20 rounded-full"></div>
          </div>

          <!-- Footer Controls Placeholder -->
          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 bg-text-alt/20 rounded-full"></div>
              <div class="h-6 w-16 bg-text-alt/20 rounded-md"></div>
            </div>
            <div class="flex space-x-2">
              <div class="h-8 w-24 bg-text-alt/20 rounded-xl"></div>
              <div class="h-8 w-24 bg-text-alt/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
