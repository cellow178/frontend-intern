<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    content?: string | null
    emptyMessage?: string
  }>(),
  {
    content: '',
    emptyMessage: 'Tidak ada konten untuk ditampilkan.',
  },
)

const isEmpty = computed(() => {
  if (!props.content) return true
  const strippedContent = props.content.replace(/<[^>]*>/g, '').trim()
  return strippedContent.length === 0
})
</script>

<template>
  <div class="rich-text-container w-full">
    <!-- State jika konten kosong -->
    <div
      v-if="isEmpty"
      class="text-text-alt italic text-center py-6 border border-dashed border-text-alt/30 rounded-xl"
    >
      {{ emptyMessage }}
    </div>

    <!-- Render HTML Konten Editor -->
    <div
      v-else
      class="ql-editor-render prose max-w-none text-text-neutral leading-relaxed wrap-break-word"
      v-html="content"
    ></div>
  </div>
</template>

<style scoped>
/* -------------------------------------------------------------
   1. HEADING STYLING
------------------------------------------------------------- */
.rich-text-container :deep(h1) {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 800;
  color: var(--color-text-neutral);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.rich-text-container :deep(h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: var(--color-text-neutral);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.rich-text-container :deep(h3) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: var(--color-text-neutral);
  margin-top: 1rem;
  margin-bottom: 0.375rem;
}

.rich-text-container :deep(p) {
  margin-top: 0.25rem;
  margin-bottom: 0.375rem;
}

/* -------------------------------------------------------------
   2. CODE BLOCK STYLING
------------------------------------------------------------- */
.rich-text-container :deep(pre),
.rich-text-container :deep(pre.ql-syntax) {
  background-color: #1e1e1e !important;
  color: #d4d4d4 !important;
  padding: 1rem 1.25rem !important;
  border-radius: 0.75rem !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.875rem !important;
  line-height: 1.6 !important;
  overflow-x: auto !important;
  margin: 0.75rem 0 !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  display: block !important;
}

.rich-text-container :deep(.ql-code-block) {
  background-color: #1e1e1e !important;
  color: #d4d4d4 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.875rem !important;
  padding: 0.25rem 1.25rem !important;
  white-space: pre-wrap !important;
}

/* -------------------------------------------------------------
   3. PERBAIKAN LIST BULLET & INDENTASI
------------------------------------------------------------- */
.rich-text-container :deep(ul) {
  list-style-type: disc !important;
  padding-left: 2rem !important;
  margin: 0.5rem 0 !important;
}

.rich-text-container :deep(ol) {
  list-style-type: decimal !important;
  padding-left: 2rem !important;
  margin: 0.5rem 0 !important;
}

.rich-text-container :deep(li) {
  display: list-item !important;
  list-style-position: outside !important;
  margin-bottom: 0.25rem;
}

.rich-text-container :deep(li[data-list='bullet']) {
  list-style-type: disc !important;
}

.rich-text-container :deep(li[data-list='ordered']) {
  list-style-type: decimal !important;
}

.rich-text-container :deep(.ql-indent-1) {
  margin-left: 1.5rem !important;
}
.rich-text-container :deep(.ql-indent-2) {
  margin-left: 3rem !important;
}
.rich-text-container :deep(.ql-indent-3) {
  margin-left: 4.5rem !important;
}
.rich-text-container :deep(.ql-indent-4) {
  margin-left: 6rem !important;
}

/* -------------------------------------------------------------
   4. ALIGNMENT & MEDIA (Dengan Pembatasan Ukuran Video)
------------------------------------------------------------- */
.rich-text-container :deep(.ql-align-center) {
  text-align: center !important;
}
.rich-text-container :deep(.ql-align-right) {
  text-align: right !important;
}
.rich-text-container :deep(.ql-align-justify) {
  text-align: justify !important;
}

.rich-text-container :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin: 0.75rem auto;
  display: block;
}

/* Video Embed (Dibatasi lebar maksimalnya) */
.rich-text-container :deep(iframe) {
  width: 100% !important;
  max-width: 640px !important; /* Membatasi lebar agar tidak terlalu besar */
  aspect-ratio: 16 / 9 !important;
  height: auto !important;
  border-radius: 0.75rem !important;
  margin: 1rem auto !important;
  display: block !important;
}

/* Pembungkus iframe bawaan Quill (ql-video) */
.rich-text-container :deep(.ql-video) {
  width: 100% !important;
  max-width: 640px !important;
  aspect-ratio: 16 / 9 !important;
  height: auto !important;
  border-radius: 0.75rem !important;
  margin: 1rem auto !important;
  display: block !important;
}

.rich-text-container :deep(blockquote) {
  border-left: 4px solid var(--color-primary, #3b82f6);
  padding-left: 1rem;
  font-style: italic;
  margin: 0.5rem 0;
  opacity: 0.9;
}

.rich-text-container :deep(a) {
  color: var(--color-primary, #3b82f6);
  text-decoration: underline;
}
</style>
