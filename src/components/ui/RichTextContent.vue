<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    content?: string | null
    emptyMessage?: string
    compact?: boolean
  }>(),
  {
    content: '',
    emptyMessage: 'Tidak ada konten untuk ditampilkan.',
    compact: false,
  },
)

const isEmpty = computed(() => {
  if (!props.content?.trim()) return true

  // Hilangkan tag dan spasi kosong, tetapi tetap anggap media sebagai konten.
  const strippedContent = props.content
    .replace(/<img\b[^>]*>/gi, 'MEDIA')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, 'MEDIA')
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, 'MEDIA')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim()

  return strippedContent.length === 0
})
</script>

<template>
  <div class="rich-text-container w-full min-w-0" :class="{ 'rich-compact': compact }">
    <!-- Konten kosong -->
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
   1. HEADING & SPACING
------------------------------------------------------------- */

/* Mode compact (bilik suara): rapatkan tipografi agar muat 1 layar */
.rich-compact :deep(h1),
.rich-compact :deep(h2),
.rich-compact :deep(h3),
.rich-compact :deep(h4) {
  margin-top: 0.625rem !important;
  margin-bottom: 0.25rem !important;
}
.rich-compact :deep(h1) {
  font-size: 1.125rem !important;
  line-height: 1.5rem !important;
}
.rich-compact :deep(h2) {
  font-size: 1rem !important;
  line-height: 1.375rem !important;
}
.rich-compact :deep(h3) {
  font-size: 0.9375rem !important;
  line-height: 1.25rem !important;
}
.rich-compact :deep(h4) {
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}
.rich-compact :deep(p) {
  font-size: 0.875rem !important;
  line-height: 1.5 !important;
  margin-bottom: 0.125rem !important;
}
.rich-compact :deep(p:has(> br:only-child)) {
  min-height: 0.25rem !important;
  margin-bottom: 0.125rem !important;
}
.rich-compact :deep(ul),
.rich-compact :deep(ol) {
  margin: 0.25rem 0 !important;
  padding-left: 1.5rem !important;
}
.rich-compact :deep(li) {
  margin-bottom: 0.125rem !important;
}
.rich-compact :deep(img) {
  margin: 0.5rem auto !important;
}
.rich-compact :deep(blockquote) {
  margin: 0.25rem 0 !important;
  padding-left: 0.75rem !important;
}

.rich-text-container :deep(h1) {
  font-size: 1.375rem;
  line-height: 1.875rem;
  font-weight: 800;
  color: var(--color-text-neutral);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .rich-text-container :deep(h1) {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}

.rich-text-container :deep(h2) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  color: var(--color-text-neutral);
  margin-top: 1.125rem;
  margin-bottom: 0.5rem;
}

.rich-text-container :deep(h3) {
  font-size: 1.125rem;
  line-height: 1.625rem;
  font-weight: 600;
  color: var(--color-text-neutral);
  margin-top: 1rem;
  margin-bottom: 0.375rem;
}

.rich-text-container :deep(h4) {
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 600;
  color: var(--color-text-neutral);
  margin-top: 0.875rem;
  margin-bottom: 0.375rem;
}

.rich-text-container :deep(p) {
  font-size: 1rem;
  line-height: 1.625;
  margin-top: 0;
  margin-bottom: 0.25rem;
}

@media (min-width: 768px) {
  .rich-text-container :deep(h2) {
    font-size: 1.375rem;
    line-height: 1.875rem;
  }

  .rich-text-container :deep(p) {
    font-size: 1.125rem;
  }
}

.rich-text-container :deep(p:empty) {
  min-height: 0.25rem;
  margin-bottom: 0;
}

/* Paragraf kosong bawaan Quill (<p><br></p>) — rapatkan jadi spasi kecil */
.rich-text-container :deep(p:has(> br:only-child)) {
  line-height: 1;
  min-height: 0.5rem;
  margin-bottom: 0.25rem;
}

/* -------------------------------------------------------------
   2. CODE BLOCK
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
   3. LIST & INDENTASI
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
   4. ALIGNMENT TEKS
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

/* -------------------------------------------------------------
   4b. SIZE (hasil toolbar ukuran font editor)
------------------------------------------------------------- */

.rich-text-container :deep(.ql-size-small) {
  font-size: 0.75em;
}

.rich-text-container :deep(.ql-size-large) {
  font-size: 1.5em;
}

.rich-text-container :deep(.ql-size-huge) {
  font-size: 2.5em;
}

/* -------------------------------------------------------------
   5. GAMBAR
   Selalu di tengah, proporsi asli dipertahankan, responsif.
------------------------------------------------------------- */

.rich-text-container :deep(img) {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  object-fit: contain;
  border-radius: 0.75rem;
  margin: 1rem auto !important;
}

/* -------------------------------------------------------------
   6. VIDEO
   Selalu di tengah dengan rasio 16:9.
------------------------------------------------------------- */

.rich-text-container :deep(iframe),
.rich-text-container :deep(video),
.rich-text-container :deep(.ql-video) {
  display: block !important;
  width: 100% !important;
  max-width: 640px !important;
  aspect-ratio: 16 / 9 !important;
  height: auto !important;
  border: 0;
  border-radius: 0.75rem !important;
  margin: 1rem auto !important;
}

/* -------------------------------------------------------------
   7. BLOCKQUOTE & LINK
------------------------------------------------------------- */

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
