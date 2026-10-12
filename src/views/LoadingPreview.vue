<script setup lang="ts">
import schoolLogo from '@/assets/logo.png'
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-secondary"
    role="status"
    aria-label="Memuat halaman"
  >
    <div class="logo-loading">
      <div class="logo-glow"></div>

      <img :src="schoolLogo" alt="Logo sekolah" class="school-logo" />
    </div>
  </main>
</template>

<style scoped>
.logo-loading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logo-bounce 1.4s ease-in-out infinite;
}

.school-logo {
  position: relative;
  z-index: 1;
  display: block;
  width: 112px;
  height: 112px;
  object-fit: contain;

  /* Animasi bernapas yang terlihat jelas */
  animation: logo-breathe 1.5s ease-in-out infinite;

  filter: drop-shadow(0 0 12px var(--color-primary, #6366f1));
}

.logo-glow {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--color-primary, #6366f1);
  filter: blur(28px);
  animation: glow-pulse 1.5s ease-in-out infinite !important;
}

@keyframes logo-breathe {
  0%,
  100% {
    scale: 1;
  }

  50% {
    scale: 1.3;
  }
}

@keyframes logo-bounce {
  0%,
  100% {
    translate: 0 0;
  }

  35% {
    translate: 0 -24px;
  }

  50% {
    translate: 0 0;
  }

  65% {
    translate: 0 -8px;
  }

  80% {
    translate: 0 0;
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    scale: 0.8;
    opacity: 0.25;
  }

  50% {
    scale: 1.5;
    opacity: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-loading,
  .school-logo,
  .logo-glow {
    animation: none;
  }
}
</style>
