<script setup lang="ts">
import api from '@/services/api.ts'
import { ref, onMounted } from 'vue'
import { RiPencilLine, RiSendPlane2Fill, RiArrowDownSLine } from '@remixicon/vue'
import Switch from '@/components/ui/Switch.vue'
import Radio from '../ui/Radio.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import ilustrasiKritikSaran from '@/assets/illustrations/ilustrasi-feedback.png'

interface Category {
  id: number
  category_name: string
}

const categories = ref<Category[]>([])
const senderName = ref('')
const type = ref(true) // true = Kritik, false = Saran
const categoryId = ref<number | null>(null)
const message = ref('')
const isAnonymous = ref(false)
const isSubmitting = ref(false)

const fetchCategories = async () => {
  try {
    const response = await api.get('/no-auth/feedback-categories')
    categories.value = response.data.data
  } catch (err) {
    console.error('Gagal ambil data kategori:', err)
  }
}

const submitFeedback = async () => {
  if (!categoryId.value || !message.value) {
    alert('Kategori dan pesan wajib diisi')
    return
  }

  isSubmitting.value = true
  try {
    await api.post('/no-auth/feedback/create', {
      sender_name: isAnonymous.value ? null : senderName.value,
      type: type.value,
      category_id: categoryId.value,
      message: message.value,
      is_anonymous: isAnonymous.value,
    })

    // reset form
    senderName.value = ''
    type.value = true
    categoryId.value = null
    message.value = ''
    isAnonymous.value = false
    alert('Terima kasih, masukan kamu sudah terkirim!')
  } catch (err) {
    console.error('Gagal kirim feedback:', err)
    alert('Gagal mengirim, coba lagi nanti.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <section id="kritik-saran" class="bg-secondary px-12 py-16 scroll-mt-15">
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
      <form @submit.prevent="submitFeedback" class="flex flex-col gap-6">
        <!-- Nama pengirim -->
        <div>
          <label class="font-bold text-text-neutral flex items-center gap-2 mb-2">
            Nama Pengirim <span class="font-normal text-text-alt">(Opsional)</span>
          </label>
          <Input v-model="senderName" :disabled="isAnonymous" placeholder="Ketik di sini..." />
        </div>

        <!-- Anonim -->
        <div class="flex items-center justify-between">
          <span class="font-bold text-text-neutral">Kirim sebagai anonim</span>
          <Switch v-model="isAnonymous" />
        </div>

        <!-- Tipe -->
        <div>
          <label class="font-bold text-text-neutral block mb-2">Tipe</label>
          <div class="flex items-center gap-6">
            <Radio v-model="type" :value="true" label="Kritik" />
            <Radio v-model="type" :value="false" label="Saran" />
          </div>
        </div>

        <!-- Kategori -->
        <div>
          <label class="font-bold text-text-neutral block mb-2">Kategori</label>
          <div class="relative w-full">
            <select
              v-model="categoryId"
              class="w-full border border-text-alt/30 rounded-xl px-4 py-3 pr-10 bg-neutral text-text-neutral focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option :value="null" disabled>Pilih kategori sesuai pesan anda</option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
                class="hover:bg-secondary"
              >
                {{ cat.category_name }}
              </option>
            </select>

            <!-- Ikon Panah Kustom -->
            <RiArrowDownSLine
              class="w-5 h-5 text-text-alt absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        <!-- Pesan -->
        <div>
          <label class="font-bold text-text-neutral block mb-2">Pesan</label>
          <Input v-model="message" type="textarea" placeholder="Bagikan pendapatmu..." :rows="3" />
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
