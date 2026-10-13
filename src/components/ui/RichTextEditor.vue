<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

// Format Image bawaan Quill
const Image = Quill.import('formats/image') as any

class CustomImage extends Image {
  static create(value: string | Record<string, string>) {
    const node = super.create(value)

    if (typeof value === 'object' && value.style) {
      node.setAttribute('style', value.style)
    }

    return node
  }

  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode)

    if (domNode.hasAttribute('style')) {
      formats.style = domNode.getAttribute('style')
    }

    return formats
  }

  format(name: string, value: any) {
    if (name === 'style') {
      if (value) {
        this.domNode.setAttribute('style', value)
      } else {
        this.domNode.removeAttribute('style')
      }
    } else {
      super.format(name, value)
    }
  }
}

// Format Video bawaan Quill
const Video = Quill.import('formats/video') as any

class CustomVideo extends Video {
  static create(value: string | Record<string, string>) {
    // Quill mengharapkan URL sebagai nilai embed video.
    const node = super.create(typeof value === 'object' ? (value as any).url : value)

    if (typeof value === 'object' && value.style) {
      node.setAttribute('style', value.style)
    }

    return node
  }

  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode)

    if (domNode.hasAttribute('style')) {
      formats.style = domNode.getAttribute('style')
    }

    return formats
  }

  format(name: string, value: any) {
    if (name === 'style') {
      if (value) {
        this.domNode.setAttribute('style', value)
      } else {
        this.domNode.removeAttribute('style')
      }
    } else {
      super.format(name, value)
    }
  }
}

Quill.register(CustomImage, true)
Quill.register(CustomVideo, true)

// Daftarkan format size agar toolbar ukuran font tersedia
const Size = Quill.import('formats/size') as any
Size.whitelist = ['small', false, 'large', 'huge']
Quill.register(Size, true)

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
let quill: Quill | null = null

onMounted(() => {
  if (!editorRef.value) return

  quill = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: 'Tulis di sini...',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        [{ size: Size.whitelist }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ color: [] }, { background: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],

      keyboard: {
        bindings: {
          deleteVideoBackward: {
            key: 'Backspace',
            collapsed: true,
            handler(range: any) {
              if (!quill || range.index < 1) return true

              const ops = quill.getContents().ops ?? []
              let index = 0

              // Cari posisi embed video di Delta.
              const videoIndexes: number[] = []

              for (const op of ops) {
                const insert = op.insert
                const length = typeof insert === 'string' ? insert.length : 1

                if (typeof insert === 'object' && insert !== null && 'video' in insert) {
                  videoIndexes.push(index)
                }

                index += length
              }

              // Cari video terdekat sebelum kursor.
              const videoIndex = videoIndexes
                .filter((i) => i < range.index)
                .sort((a, b) => b - a)[0]

              if (videoIndex === undefined) return true

              // Jangan menghapus video jika masih ada konten di antara kursor dan video.
              const between = quill.getText(videoIndex + 1, range.index - videoIndex - 1)

              if (between.replace(/[\n\r]/g, '').length > 0) {
                return true
              }

              quill.deleteText(videoIndex, 1, Quill.sources.USER)
              return false
            },
          },

          deleteVideoForward: {
            key: 'Delete',
            collapsed: true,
            handler(range: any) {
              if (!quill) return true

              const targetIndex = range.index
              const ops = quill.getContents().ops ?? []
              let currentIndex = 0

              for (const op of ops) {
                const insert = op.insert
                const length = typeof insert === 'string' ? insert.length : 1

                if (
                  currentIndex === targetIndex &&
                  typeof insert === 'object' &&
                  insert !== null &&
                  'video' in insert
                ) {
                  quill.deleteText(targetIndex, 1, Quill.sources.USER)
                  return false
                }

                currentIndex += length
              }

              return true
            },
          },
        },
      },
    },
  })

  if (props.modelValue) {
    quill.clipboard.dangerouslyPasteHTML(props.modelValue)
  }

  quill.on('text-change', () => {
    if (quill) {
      emit('update:modelValue', quill.root.innerHTML)
    }
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (quill && newValue !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(newValue || '')
    }
  },
)

onBeforeUnmount(() => {
  quill = null
})
</script>

<template>
  <div class="relative border border-text-alt/30 rounded-xl bg-neutral">
    <div ref="editorRef"></div>
  </div>
</template>

<style>
.ql-toolbar.ql-snow {
  border: none;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text-alt) 20%, transparent);
  background-color: transparent;
  padding: 8px 12px;
}

.ql-container.ql-snow {
  border: none;
  min-height: 12rem;
  font-family: inherit;
  font-size: 0.875rem;
}

.ql-editor {
  min-height: 12rem;
}

/* Gambar di editor tetap proporsional */
.ql-editor img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* Toolbar hover dan active */
.ql-snow.ql-toolbar button,
.ql-snow .ql-toolbar button,
.ql-snow.ql-toolbar .ql-picker,
.ql-snow .ql-toolbar .ql-picker {
  opacity: 0.45;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

.ql-snow.ql-toolbar button:hover,
.ql-snow .ql-toolbar button:hover,
.ql-snow.ql-toolbar .ql-picker:hover,
.ql-snow .ql-toolbar .ql-picker:hover,
.ql-snow.ql-toolbar button.ql-active,
.ql-snow .ql-toolbar button.ql-active,
.ql-snow.ql-toolbar .ql-picker.ql-expanded,
.ql-snow .ql-toolbar .ql-picker.ql-expanded {
  opacity: 1 !important;
}

.ql-snow.ql-toolbar button.ql-active,
.ql-snow .ql-toolbar button.ql-active,
.ql-snow.ql-toolbar button:hover,
.ql-snow .ql-toolbar button:hover {
  color: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button.ql-active .ql-stroke,
.ql-snow .ql-toolbar button.ql-active .ql-stroke,
.ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
.ql-snow .ql-toolbar button.ql-active .ql-stroke-miter,
.ql-snow.ql-toolbar button:hover .ql-stroke,
.ql-snow .ql-toolbar button:hover .ql-stroke {
  stroke: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button.ql-active .ql-fill,
.ql-snow .ql-toolbar button.ql-active .ql-fill,
.ql-snow.ql-toolbar button:hover .ql-fill,
.ql-snow .ql-toolbar button:hover .ql-fill {
  fill: var(--color-primary) !important;
}

/* Tooltip link dan video */
.ql-snow .ql-tooltip {
  z-index: 50 !important;
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  border-radius: 0.5rem !important;
  padding: 8px 12px !important;
  left: 10px !important;
}

.ql-snow .ql-tooltip input[type='text'] {
  background-color: #0f172a !important;
  color: #ffffff !important;
  border: 1px solid #475569 !important;
  border-radius: 0.375rem !important;
  padding: 4px 8px !important;
  outline: none !important;
}

.ql-snow .ql-tooltip a.ql-action::after {
  color: #38bdf8 !important;
  font-weight: bold;
}

/* Video di editor: tidak dipaksa mengikuti alignment */
.ql-editor iframe.ql-video {
  display: block;
  max-width: 100%;
  cursor: pointer;
}
</style>
