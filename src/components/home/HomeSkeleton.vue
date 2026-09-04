<script setup lang="ts"></script>

<template>
  <div class="animate-pulse">
    
    <!-- Hero Skeleton -->
    <div class="relative h-screen w-full overflow-hidden bg-text-alt/5">
      <div
        class="relative h-full flex flex-col justify-center px-6 pb-16 max-w-3xl mx-auto sm:px-8 sm:pb-20 lg:items-start lg:px-12 lg:pb-24 lg:mx-0"
      >
        <!-- Subtitle / Motto -->
        <div class="h-6 w-44 bg-text-alt/15 rounded mb-2"></div>

        <!-- Title (Nama Sekolah) -->
        <div
          class="h-9 w-64 bg-text-alt/15 rounded mb-3 sm:h-12 sm:w-96 sm:mb-4 lg:h-14 lg:w-lg"
        ></div>

        <!-- Description -->
        <div class="w-full space-y-2 mb-6 sm:mb-7 lg:mb-8">
          <div class="h-5 w-3/4 bg-text-alt/15 rounded sm:h-6"></div>
          <div class="h-5 w-3/4 bg-text-alt/15 rounded sm:h-6"></div>
        </div>

        <!-- Tombol (Video Profil & Pusat Voting) -->
        <div
          class="flex flex-col items-stretch gap-3 w-full sm:flex-row sm:items-center sm:gap-4 lg:w-auto lg:justify-start"
        >
          <div class="h-12 w-full bg-text-alt/15 rounded-xl sm:flex-1 lg:w-40 lg:flex-none"></div>
          <div class="h-12 w-full bg-text-alt/15 rounded-xl sm:flex-1 lg:w-40 lg:flex-none"></div>
        </div>
      </div>
    </div>

    <!-- Profile Skeleton -->
    <div class="px-6 py-16 sm:px-8 lg:px-12 lg:py-32">
      <div
        class="flex flex-col justify-center items-start gap-10 sm:gap-12 lg:flex-row lg:items-center lg:gap-16"
      >
        <!-- Kolom Teks -->
        <div class="w-full flex flex-col max-w-160 gap-4 lg:w-fit lg:flex-1">
          <div class="h-6 w-44 bg-text-alt/15 rounded"></div>
          <div class="h-10 w-72 bg-text-alt/15 rounded mb-2 lg:mb-4"></div>
          <div class="h-4 w-full bg-text-alt/15 rounded"></div>
          <div class="h-4 w-full bg-text-alt/15 rounded"></div>
          <div class="h-4 w-4/5 bg-text-alt/15 rounded"></div>
        </div>

        <!-- Kolom Gambar -->
        <div
          class="flex flex-col gap-4 w-full max-w-104 sm:max-w-none sm:flex-row lg:flex-col lg:gap-8 lg:w-auto lg:max-w-104 lg:flex-1"
        >
          <div class="w-full aspect-video bg-text-alt/15 rounded-xl sm:flex-1"></div>
          <div class="w-full aspect-video bg-text-alt/15 rounded-xl sm:flex-1"></div>
        </div>
      </div>
    </div>

    <!-- Visi, Misi & Statistik Skeleton -->
    <div class="p-6 flex flex-col gap-10 sm:px-8 sm:gap-12 md:px-12 lg:py-16 lg:gap-16">
      <!-- Visi Skeleton -->
      <div class="flex flex-col items-center gap-4 text-center sm:gap-5 lg:gap-6">
        <div class="h-7 w-24 bg-text-alt/15 rounded-lg animate-pulse"></div>
        <div class="w-full max-w-2xl space-y-2 flex flex-col items-center">
          <div class="h-6 w-full bg-text-alt/15 rounded sm:h-7 lg:h-8 animate-pulse"></div>
          <div class="h-6 w-3/4 bg-text-alt/15 rounded sm:h-7 lg:h-8 animate-pulse"></div>
        </div>
      </div>

      <!-- Misi Skeleton -->
      <div class="flex flex-col items-center gap-8 lg:gap-12 w-full">
        <div class="h-7 w-24 bg-text-alt/15 rounded-lg animate-pulse"></div>

        <!-- Mobile & Tablet Skeleton (1 Kolom) -->
        <div class="flex flex-col w-full max-w-6xl gap-6 sm:gap-7 lg:hidden">
          <div
            v-for="n in 6"
            :key="`m-skel-${n}`"
            class="h-20 w-full bg-text-alt/15 rounded-xl animate-pulse"
          ></div>
        </div>

        <!-- Desktop Skeleton (2 Kolom) -->
        <div class="relative hidden w-full max-w-6xl gap-x-24 gap-y-10 lg:grid lg:grid-cols-2">
          <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-text-alt/15"></div>

          <div
            v-for="n in 6"
            :key="`d-skel-${n}`"
            class="h-24 w-full bg-text-alt/15 rounded-xl animate-pulse"
            :class="n % 2 !== 0 ? 'pr-12' : ''"
          ></div>
        </div>
      </div>

      <!-- Statistik Skeleton -->
      <div
        class="flex flex-col items-start gap-6 sm:flex-row sm:flex-nowrap sm:items-stretch sm:justify-center sm:gap-4 md:gap-6 lg:flex-wrap lg:gap-16 xl:gap-30"
      >
        <div
          v-for="n in 3"
          :key="`stat-skel-${n}`"
          class="w-full max-w-96 flex flex-col items-start gap-4 bg-text-alt/15 rounded-2xl p-4 sm:max-w-none sm:flex-1 sm:min-w-0 sm:p-4 sm:gap-2.5 sm:items-center md:p-5 md:gap-3 lg:w-76 lg:flex-none lg:p-8 lg:gap-4"
        >
          <!-- Header Skeleton: Icon + Label -->
          <div class="flex flex-row gap-4 items-center w-full sm:flex-col sm:gap-4 sm:items-center">
            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-full bg-text-alt/20 shrink-0 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-18 lg:h-18"
            ></div>

            <!-- Label (2 baris text) -->
            <div class="flex flex-col gap-1.5 w-full sm:items-center">
              <div class="h-5 w-24 bg-text-alt/20 rounded sm:h-4 md:h-5 lg:h-6"></div>
              <div class="h-5 w-32 bg-text-alt/20 rounded sm:h-4 md:h-5 lg:h-6"></div>
            </div>
          </div>

          <!-- Description Skeleton (2 baris text) -->
          <div class="flex flex-col gap-2 w-full sm:items-center">
            <div class="h-3.5 w-full bg-text-alt/20 rounded lg:h-4"></div>
            <div class="h-3.5 w-4/5 bg-text-alt/20 rounded lg:h-4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Profil Skeleton -->
    <div class="px-12 py-16 flex flex-col items-center gap-8">
      <div class="w-full max-w-4xl aspect-video rounded-2xl bg-text-alt/15 shadow-lg"></div>
    </div>

    <!-- Major Skeleton -->
    <div class="px-6 py-10 flex flex-col items-center gap-10 md:px-12 md:py-16 md:gap-16">
      <div class="flex flex-col items-center gap-3 text-center md:gap-4">
        <div class="h-7 w-52 bg-text-alt/15 rounded-lg"></div>
        <div class="h-5 w-64 bg-text-alt/15 rounded sm:w-80"></div>
      </div>

      <div
        class="grid grid-cols-2 gap-4 w-full sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-14 lg:max-w-14xl"
      >
        <div
          v-for="n in 9"
          :key="`major-skel-${n}`"
          class="w-full lg:w-90 bg-text-alt/5 rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-4"
        >
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div
              class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-text-alt/15 shrink-0"
            ></div>
            <div class="h-5 w-16 sm:h-6 sm:w-20 lg:h-7 lg:w-24 bg-text-alt/15 rounded"></div>
          </div>

          <div class="flex-1 flex flex-col gap-2">
            <div class="h-4 w-3/4 sm:h-5 lg:h-6 bg-text-alt/15 rounded mb-1"></div>
            <div class="space-y-1.5">
              <div class="h-3.5 w-full bg-text-alt/15 rounded sm:h-4"></div>
              <div class="h-3.5 w-full bg-text-alt/15 rounded sm:h-4"></div>
              <div class="h-3.5 w-2/3 bg-text-alt/15 rounded sm:h-4"></div>
            </div>
          </div>

          <div class="hidden lg:flex items-center gap-2 mt-auto pt-2">
            <div class="h-4 w-20 bg-text-alt/15 rounded"></div>
            <div class="w-4 h-4 bg-text-alt/15 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Skeleton -->
    <div
      class="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-8 lg:px-12 lg:py-16 md:gap-12"
    >
      <div class="flex flex-col items-center gap-3 text-center md:gap-4">
        <div class="h-7 w-28 bg-text-alt/15 rounded-lg"></div>
        <div class="h-5 w-64 bg-text-alt/15 rounded sm:w-96 md:w-md"></div>
      </div>

      <div
        class="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-12"
      >
        <div
          v-for="n in 3"
          :key="`event-skel-${n}`"
          class="w-full flex flex-col bg-text-alt/5 rounded-xl overflow-hidden lg:w-72 lg:rounded-2xl"
        >
          <div class="h-48 w-full bg-text-alt/15 sm:h-64 lg:h-72"></div>

          <div class="flex flex-col gap-2 p-3 lg:gap-3 lg:p-6">
            <div>
              <div class="h-4 w-3/4 bg-text-alt/15 rounded lg:h-6"></div>
              <div class="w-8 h-0.5 bg-text-alt/15 mt-1.5 lg:w-12 lg:mt-2"></div>
            </div>

            <div class="flex flex-col gap-1.5 lg:gap-2 pt-1">
              <div class="flex items-center gap-1.5 lg:gap-2">
                <div class="w-3.5 h-3.5 rounded-full bg-text-alt/15 shrink-0 lg:w-4 lg:h-4"></div>
                <div class="h-3 w-1/2 bg-text-alt/15 rounded lg:h-4"></div>
              </div>
              <div class="flex items-center gap-1.5 lg:gap-2">
                <div class="w-3.5 h-3.5 rounded-full bg-text-alt/15 shrink-0 lg:w-4 lg:h-4"></div>
                <div class="h-3 w-2/3 bg-text-alt/15 rounded lg:h-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-11 w-36 bg-text-alt/15 rounded-xl mt-2"></div>
    </div>

    <!-- News Skeleton -->
    <div
      class="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-8 lg:px-12 lg:py-16 md:gap-12"
    >
      <div class="flex flex-col items-center gap-3 text-center md:gap-4">
        <div class="h-7 w-36 bg-text-alt/15 rounded-lg"></div>
        <div class="h-5 w-64 bg-text-alt/15 rounded sm:w-96 md:w-120"></div>
      </div>

      <div
        class="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-12"
      >
        <div
          v-for="n in 3"
          :key="`news-${n}`"
          class="w-full flex flex-col bg-text-alt/5 rounded-xl overflow-hidden border border-text-alt/10 lg:w-80 lg:rounded-2xl"
        >
          <div class="flex items-center justify-between px-3 py-2.5 lg:px-5 lg:py-4">
            <div class="h-3 w-1/3 bg-text-alt/15 rounded lg:h-4"></div>
            <div class="h-3 w-1/4 bg-text-alt/15 rounded lg:h-4"></div>
          </div>
          <div class="h-32 w-full bg-text-alt/15 sm:h-40 lg:h-48"></div>
          <div class="flex flex-col gap-2 p-3 lg:p-5">
            <div class="h-4 w-16 bg-text-alt/15 rounded-md lg:h-6 lg:w-20"></div>
            <div class="space-y-1 pt-1">
              <div class="h-4 w-full bg-text-alt/15 rounded lg:h-5"></div>
              <div class="h-4 w-3/4 bg-text-alt/15 rounded lg:h-5"></div>
            </div>
            <div class="space-y-1.5 pt-1">
              <div class="h-3 w-full bg-text-alt/15 rounded lg:h-3.5"></div>
              <div class="h-3 w-4/5 bg-text-alt/15 rounded lg:h-3.5"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-11 w-36 bg-text-alt/15 rounded-xl mt-2"></div>
    </div>

    <!-- Voting Section -->
    <!-- <div
      class="bg-text-alt/5 border-y border-text-alt/10 px-6 py-10 flex flex-col items-center gap-8 sm:px-12 sm:py-16 sm:gap-12"
    >
      <div class="flex flex-col items-center gap-3 text-center sm:gap-4">
        <div class="flex flex-row items-center gap-2 sm:gap-4">
          <div class="h-8 w-32 bg-text-alt/15 rounded-xl sm:h-9 sm:w-40 sm:rounded-2xl"></div>
          <div class="h-5 w-36 bg-text-alt/15 rounded sm:h-6 sm:w-44"></div>
        </div>

        <div class="h-7 w-64 bg-text-alt/15 rounded-lg sm:h-10 sm:w-96"></div>

        <div class="w-full max-w-2xl space-y-2 flex flex-col items-center px-4 sm:px-0">
          <div class="h-4 w-full bg-text-alt/15 rounded sm:h-5"></div>
          <div class="h-4 w-4/5 bg-text-alt/15 rounded sm:h-5"></div>
        </div>
      </div>

      <div
        class="flex flex-col items-start gap-4 w-full max-w-90 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 lg:w-auto lg:gap-8"
      >
        <div
          v-for="n in 3"
          :key="`vote-skel-${n}`"
          class="w-full flex flex-col gap-2 text-left bg-text-alt/5 rounded-2xl p-4 border border-text-alt/10 lg:items-center lg:text-center lg:gap-4 lg:p-8 lg:w-90"
        >
          <div class="h-4 w-20 bg-text-alt/15 rounded sm:h-5 lg:h-6 lg:w-24"></div>

          <div class="flex flex-row items-start gap-4 w-full lg:flex-col lg:items-center">
            <div
              class="w-24 h-24 bg-text-alt/15 rounded-xl shrink-0 sm:w-36 sm:h-36 lg:w-56 lg:h-56"
            ></div>

            <div class="flex flex-col gap-2 flex-1 min-w-0 w-full lg:items-center">
              <div class="h-5 w-3/4 bg-text-alt/15 rounded sm:h-7 lg:w-2/3"></div>

              <div class="space-y-1.5 w-full pt-1 lg:flex lg:flex-col lg:items-center">
                <div class="h-3 w-full bg-text-alt/15 rounded lg:h-3.5 lg:w-5/6"></div>
                <div class="h-3 w-4/5 bg-text-alt/15 rounded lg:h-3.5 lg:w-2/3"></div>
              </div>

              <div class="h-3.5 w-20 bg-text-alt/15 rounded mt-1 sm:hidden lg:block lg:mt-2"></div>
            </div>
          </div>

          <div
            class="grid grid-cols-2 gap-2 w-full pt-2 lg:gap-4 lg:pt-3 lg:mt-auto border-t border-text-alt/10"
          >
            <div class="flex items-center gap-2 lg:gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-text-alt/15 shrink-0 lg:w-11 lg:h-11 lg:rounded-xl"
              ></div>
              <div class="space-y-1">
                <div class="h-4 w-8 bg-text-alt/15 rounded lg:h-5"></div>
                <div class="h-3 w-10 bg-text-alt/15 rounded lg:h-3.5"></div>
              </div>
            </div>

            <div class="flex items-center gap-2 lg:gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-text-alt/15 shrink-0 lg:w-11 lg:h-11 lg:rounded-xl"
              ></div>
              <div class="space-y-1">
                <div class="h-4 w-10 bg-text-alt/15 rounded lg:h-5"></div>
                <div class="h-3 w-12 bg-text-alt/15 rounded lg:h-3.5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-11 w-40 bg-text-alt/15 rounded-xl mt-2"></div>
    </div> -->

    <!-- Feedback Skeleton -->
    <div
      class="bg-text-alt/5 border-y border-text-alt/10 px-6 py-10 relative sm:px-8 lg:px-12 lg:py-16"
    >
      <div
        class="max-w-7xl mx-auto flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-20 lg:items-start"
      >
        <div class="flex flex-col gap-6 lg:justify-between lg:h-full lg:gap-0">
          <div class="flex items-center gap-3 sm:gap-4">
            <div
              class="w-12 h-12 bg-text-alt/15 rounded-xl shrink-0 sm:w-16 sm:h-16 sm:rounded-2xl"
            ></div>
            <div class="space-y-2">
              <div class="h-6 w-48 bg-text-alt/15 rounded sm:h-8 sm:w-64"></div>
              <div class="h-4 w-36 bg-text-alt/15 rounded sm:h-5 sm:w-48"></div>
            </div>
          </div>
          <div class="hidden w-full h-72 bg-text-alt/15 rounded-2xl lg:block"></div>
        </div>

        <div class="flex flex-col gap-5 sm:gap-6">
          <div class="flex items-center justify-between">
            <div class="h-5 w-36 bg-text-alt/15 rounded"></div>
            <div class="w-12 h-6 bg-text-alt/15 rounded-full"></div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <div class="h-4 w-32 bg-text-alt/15 rounded"></div>
              <div class="h-3 w-12 bg-text-alt/15 rounded"></div>
            </div>
            <div
              class="h-11 w-full bg-text-alt/5 border border-text-alt/10 rounded-xl sm:rounded-2xl"
            ></div>
          </div>

          <div class="space-y-2">
            <div class="h-4 w-12 bg-text-alt/15 rounded"></div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-text-alt/15"></div>
                <div class="h-4 w-12 bg-text-alt/15 rounded"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-text-alt/15"></div>
                <div class="h-4 w-12 bg-text-alt/15 rounded"></div>
              </div>
            </div>
          </div>

          <div
            class="h-11 w-full bg-text-alt/5 border border-text-alt/10 rounded-xl sm:rounded-2xl"
          ></div>

          <div class="space-y-2">
            <div class="h-4 w-16 bg-text-alt/15 rounded"></div>
            <div
              class="h-28 w-full bg-text-alt/5 border border-text-alt/10 rounded-xl sm:rounded-2xl"
            ></div>
          </div>

          <div class="h-11 w-full bg-text-alt/15 rounded-xl sm:rounded-2xl"></div>
        </div>
      </div>
    </div>

    <!-- Footer Skeleton -->
    <footer
      class="bg-text-alt/5 border-t border-text-alt/10 flex flex-col px-6 py-10 gap-8 sm:px-8 sm:gap-10 lg:px-12 lg:py-12 lg:gap-12"
    >
      <div
        class="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-10 lg:flex lg:items-start lg:justify-between lg:gap-6"
      >
        <div class="flex flex-col gap-3 col-span-2 sm:gap-4 lg:col-span-1 lg:w-fit lg:max-w-md">
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="w-11 h-11 sm:w-14 sm:h-14 bg-text-alt/15 rounded-full shrink-0"></div>
            <div class="space-y-1.5">
              <div class="h-5 w-40 sm:h-7 sm:w-52 bg-text-alt/15 rounded"></div>
              <div class="h-4 w-28 sm:h-5 sm:w-36 bg-text-alt/15 rounded"></div>
            </div>
          </div>
          <div class="space-y-2 pt-1">
            <div class="h-3.5 w-full sm:h-4 bg-text-alt/15 rounded"></div>
            <div class="h-3.5 w-full sm:h-4 bg-text-alt/15 rounded"></div>
            <div class="h-3.5 w-3/4 sm:h-4 bg-text-alt/15 rounded"></div>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
          <div class="h-5 w-20 sm:h-7 sm:w-28 bg-text-alt/15 rounded"></div>
          <div class="flex flex-col gap-2.5">
            <div
              v-for="n in 6"
              :key="`footer-menu-${n}`"
              class="h-3.5 w-24 sm:h-4 sm:w-32 bg-text-alt/15 rounded"
            ></div>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
          <div class="h-5 w-36 sm:h-7 sm:w-52 bg-text-alt/15 rounded"></div>
          <div class="flex gap-x-6 sm:gap-x-10 lg:gap-x-20">
            <div class="flex flex-col gap-2.5">
              <div
                v-for="n in 3"
                :key="`footer-major-1-${n}`"
                class="h-3.5 w-16 sm:h-4 sm:w-20 bg-text-alt/15 rounded"
              ></div>
            </div>
            <div class="flex flex-col gap-2.5">
              <div
                v-for="n in 3"
                :key="`footer-major-2-${n}`"
                class="h-3.5 w-16 sm:h-4 sm:w-20 bg-text-alt/15 rounded"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:gap-4 lg:w-fit">
          <div class="h-5 w-28 sm:h-7 sm:w-36 bg-text-alt/15 rounded"></div>
          <div class="h-4 w-36 sm:h-4.5 sm:w-44 bg-text-alt/15 rounded"></div>
          <div class="h-4 w-28 sm:h-4.5 sm:w-32 bg-text-alt/15 rounded"></div>
          <div class="flex items-center gap-3 pt-1">
            <div
              v-for="n in 4"
              :key="`footer-social-${n}`"
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-text-alt/15"
            ></div>
          </div>
        </div>
      </div>

      <div class="border-t border-text-alt/10"></div>

      <div class="h-3.5 w-64 mx-auto sm:h-4 sm:w-80 bg-text-alt/15 rounded"></div>
    </footer>
  </div>
</template>
