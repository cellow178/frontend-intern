<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { RiPencilLine, RiSendPlane2Fill } from '@remixicon/vue'
import Switch from '@/components/ui/Switch.vue'
import Radio from '../ui/Radio.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import ilustrasiKritikSaran from '@/assets/illustrations/ilustrasi-feedback.png'

interface Category {
  id: number
  category_name: string
}

const categories = ref<Category[]>([])
const senderName = ref('')
const type = ref(false) // false = Kritik, true = Saran
const categoryId = ref<number | null>(null)
const message = ref('')
const isAnonymous = ref(false)
const isSubmitting = ref(false)

const errors = ref<Record<string, string[]>>({})

const toastStore = useToastStore()

const fetchCategories = async () => {
  try {
    const response = await api.get('/no-auth/feedback-categories')
    categories.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil data kategori:', err)
  }
}

const SENDER_NAME_MAX_LENGTH = 100

const validate = () => {
  errors.value = {}

  if (!isAnonymous.value && senderName.value.length > SENDER_NAME_MAX_LENGTH) {
    errors.value.sender_name = [`Nama pengirim maksimal ${SENDER_NAME_MAX_LENGTH} karakter.`]
  }
  if (!categoryId.value) {
    errors.value.category_id = ['Kategori feedback wajib diisi.']
  }
  if (!message.value.trim()) {
    errors.value.message = ['Pesan feedback wajib diisi.']
  }

  return Object.keys(errors.value).length === 0
}

const submitFeedback = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const response = await api.post('/no-auth/feedback/create', {
      sender_name: isAnonymous.value ? null : senderName.value,
      type: type.value,
      category_id: categoryId.value,
      message: message.value,
      is_anonymous: isAnonymous.value,
    })

    // reset form
    senderName.value = ''
    type.value = false
    categoryId.value = null
    message.value = ''
    isAnonymous.value = false
    errors.value = {}

    toastStore.show(
      response.data.message || 'Terima kasih, masukan kamu sudah terkirim!',
      'success',
    )
  } catch (err: any) {
    console.error('Gagal kirim feedback:', err)

    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      toastStore.show(err.response.data.message || 'Validasi gagal.', 'error')
    } else {
      toastStore.show('Gagal mengirim masukan, coba lagi nanti.', 'error')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <section id="kritik-saran" class="bg-secondary px-12 py-16 scroll-mt-15 relative">
    <div class="max-w-7xl mx-auto grid grid-cols-2 gap-20 items-start">
      <!-- Kolom kiri: judul -->
      <div class="flex flex-col justify-between h-full">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shrink-0">
            <RiPencilLine class="w-12 h-12 text-neutral" />
          </div>
          <div>
            <h2 class="font-extrabold text-3xl text-text-neutral">Form Kritik dan Saran</h2>
            <p class="text-text-alt">Sampaikan kritik dan saran anda</p>
          </div>
        </div>
        <img :src="ilustrasiKritikSaran" class="w-full" alt="Ilustrasi kritik dan saran" />
      </div>

      <!-- Kolom kanan: form -->
      <form @submit.prevent="submitFeedback" class="flex flex-col gap-6" novalidate>
        <!-- Anonim -->
        <div class="flex items-center justify-between">
          <span
            class="font-bold transition-colors"
            :class="isAnonymous ? 'text-primary' : 'text-text-neutral'"
          >
            Kirim sebagai anonim
          </span>
          <Switch v-model="isAnonymous" />
        </div>

        <!-- Nama pengirim -->
        <div>
          <label class="font-bold text-text-neutral flex items-center justify-between mb-2">
            <span> Nama Pengirim <span class="font-normal text-text-alt">(Opsional)</span> </span>
            <span
              class="text-xs font-normal"
              :class="senderName.length > 100 ? 'text-red-500' : 'text-text-alt'"
            >
              {{ senderName.length }}/100
            </span>
          </label>
          <Input
            v-model="senderName"
            :disabled="isAnonymous"
            placeholder="Ketik di sini..."
            :error="!!errors.sender_name"
          />
          <p v-if="errors.sender_name" class="text-sm text-red-500 mt-1">
            {{ errors.sender_name[0] }}
          </p>
        </div>

        <!-- Tipe -->
        <div>
          <label class="font-bold text-text-neutral block mb-2">Tipe</label>
          <div class="flex items-center gap-6">
            <Radio v-model="type" :value="false" label="Kritik" />
            <Radio v-model="type" :value="true" label="Saran" />
          </div>
        </div>

        <!-- Kategori -->
        <Select
          v-model="categoryId"
          variant="square"
          :options="categories.map((c) => ({ value: c.id, label: c.category_name }))"
          placeholder="Pilih kategori sesuai pesan anda"
          :error="!!errors.category_id"
        />

        <!-- Pesan -->
        <div>
          <label class="font-bold text-text-neutral block mb-2">Pesan</label>
          <Input
            v-model="message"
            type="textarea"
            placeholder="Bagikan pendapat..."
            :rows="3"
            :error="!!errors.message"
          />
          <p v-if="errors.message" class="text-sm text-red-500 mt-1">{{ errors.message[0] }}</p>
        </div>

        <Button
          type="submit"
          :label="isSubmitting ? 'Mengirim...' : 'Kirim'"
          :icon-right="RiSendPlane2Fill"
          class="w-full justify-center"
        />
      </form>
    </div>
  </section>
</template>
