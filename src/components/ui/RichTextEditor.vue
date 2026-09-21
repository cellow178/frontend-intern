<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import { CustomImageResize } from '@/utils/quillImageResize'
import 'quill/dist/quill.snow.css'

// 1. Ambil format Image asli dari Quill
const Image = Quill.import('formats/image') as any

// 2. Custom Image Format yang mengizinkan atribut 'style'
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

// 3. Custom Video Format yang mengizinkan atribut 'style'
const Video = Quill.import('formats/video') as any

class CustomVideo extends Video {
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

// Registrasikan ke Quill
Quill.register(CustomImage, true)
Quill.register(CustomVideo, true)
Quill.register('modules/imageResize', CustomImageResize)

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
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ color: [] }, { background: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      imageResize: {},
    },
  })

  if (props.modelValue) {
    quill.clipboard.dangerouslyPasteHTML(props.modelValue)
  }

  quill.on('text-change', () => {
    emit('update:modelValue', quill!.root.innerHTML)
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
/* Style Toolbar Bawaan Kamu */
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

.ql-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* Hover & Active States Sesuai Warna Bawaan Kamu */
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
.ql-snow .ql-toolbar button.ql-active {
  color: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button.ql-active .ql-stroke,
.ql-snow .ql-toolbar button.ql-active .ql-stroke,
.ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
.ql-snow .ql-toolbar button.ql-active .ql-stroke-miter {
  stroke: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button.ql-active .ql-fill,
.ql-snow .ql-toolbar button.ql-active .ql-fill {
  fill: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button:hover,
.ql-snow .ql-toolbar button:hover {
  color: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button:hover .ql-stroke,
.ql-snow .ql-toolbar button:hover .ql-stroke {
  stroke: var(--color-primary) !important;
}

.ql-snow.ql-toolbar button:hover .ql-fill,
.ql-snow .ql-toolbar button:hover .ql-fill {
  fill: var(--color-primary) !important;
}

/* Tooltip / Popup Input Link & Video Sesuai Warna Bawaan Kamu */
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

/* Perbaikan khusus Iframe & Video Alignment */
.ql-editor iframe {
  pointer-events: none !important;
  display: inline-block;
}

.ql-editor p.ql-align-center {
  text-align: center;
}

.ql-editor p.ql-align-right {
  text-align: right;
}

.ql-editor p.ql-align-center iframe,
.ql-editor .ql-video.ql-align-center {
  margin-left: auto !important;
  margin-right: auto !important;
}

.ql-editor p.ql-align-right iframe,
.ql-editor .ql-video.ql-align-right {
  margin-left: auto !important;
  margin-right: 0 !important;
}
</style>
