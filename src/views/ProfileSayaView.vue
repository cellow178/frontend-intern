<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useSiteDataStore } from '@/stores/siteData'
import AdminButton from '@/components/ui/AdminButton.vue'
import Input from '@/components/ui/Input.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RequiredBadge from '@/components/ui/RequiredBadge.vue'
import { RiSaveLine, RiLockPasswordLine, RiLogoutBoxRLine } from '@remixicon/vue'
import BackButton from '@/components/ui/BackButton.vue'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const siteDataStore = useSiteDataStore()
const { user } = storeToRefs(authStore)
const { schoolName } = storeToRefs(siteDataStore)

// Flag wajib-ganti-password dari user yang sedang login.
// Siswa yang masih true dikunci di halaman ini oleh router guard.
// Guru/admin yang baru di-reset admin (password = username) juga mendarat
// di sini dengan flag yang sama — teks & aturan dibedakan per role.
const mustChangePassword = computed(() => user.value?.must_change_password === true)
const isSiswa = computed(() => user.value?.role_code === 'siswa' || user.value?.role_id === 3)
const currentUsername = computed(() => user.value?.username ?? '')
const currentNisn = computed(() => user.value?.nisn ?? '')
const passwordHint = computed(() =>
  isSiswa.value
    ? 'Minimal 5 karakter. Jangan samakan dengan NISN.'
    : 'Minimal 5 karakter. Jangan samakan dengan username.',
)
const isLoggingOut = ref(false)

// --- Form profil (boleh diubah sendiri) ---
const profileForm = reactive({
  fullname: '',
  username: '',
  email: '',
})

const profileErrors = reactive({
  fullname: '',
  username: '',
  email: '',
})

const isLoadingProfile = ref(true)
const isSavingProfile = ref(false)

// --- Form ganti password (butuh password lama) ---
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  new_password_confirmation: '',
})

const passwordErrors = reactive({
  old_password: '',
  new_password: '',
})

const isChangingPassword = ref(false)

const fetchMe = async () => {
  isLoadingProfile.value = true
  try {
    const response = await api.get('/me')
    const me = response.data?.user
    if (!me) throw new Error('empty')
    authStore.setUserFromMe(me, response.data?.permissions ?? authStore.permissions)
    profileForm.fullname = me.fullname ?? ''
    profileForm.username = me.username ?? ''
    profileForm.email = me.email ?? ''
  } catch {
    toastStore.show('Gagal memuat data profil.', 'error')
  } finally {
    isLoadingProfile.value = false
  }
}

const emptyToNull = (val: string) => (val.trim() === '' ? null : val.trim())

const handleSaveProfile = async () => {
  let ok = true
  profileErrors.fullname = ''
  profileErrors.username = ''
  profileErrors.email = ''

  if (!profileForm.fullname.trim()) {
    profileErrors.fullname = 'Nama lengkap wajib diisi.'
    ok = false
  } else if (profileForm.fullname.trim().length > 255) {
    profileErrors.fullname = 'Nama lengkap maksimal 255 karakter.'
    ok = false
  }

  if (!profileForm.username.trim()) {
    profileErrors.username = 'Username wajib diisi.'
    ok = false
  } else if (profileForm.username.trim().length > 100) {
    profileErrors.username = 'Username maksimal 100 karakter.'
    ok = false
  }

  if (profileForm.email.trim()) {
    if (profileForm.email.trim().length > 255) {
      profileErrors.email = 'Email maksimal 255 karakter.'
      ok = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      profileErrors.email = 'Format email tidak valid.'
      ok = false
    }
  }

  if (!ok) {
    nextTick(() => {
      document
        .querySelector('.border-error')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }

  isSavingProfile.value = true
  try {
    const response = await api.put('/users/update-profile', {
      fullname: profileForm.fullname.trim(),
      username: profileForm.username.trim(),
      email: emptyToNull(profileForm.email),
    })
    if (response.data?.data) {
      authStore.setUserFromMe(response.data.data, authStore.permissions)
    }
    toastStore.show('Profil berhasil diperbarui!', 'success')
  } catch (err: unknown) {
    const apiErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = apiErr.response?.data?.errors
    if (fieldErrors) {
      if (fieldErrors.fullname?.[0]) profileErrors.fullname = fieldErrors.fullname[0]
      if (fieldErrors.username?.[0]) profileErrors.username = fieldErrors.username[0]
      if (fieldErrors.email?.[0]) profileErrors.email = fieldErrors.email[0]
    }
    toastStore.show(apiErr.response?.data?.message || 'Gagal menyimpan profil.', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

const handleChangePassword = async () => {
  passwordErrors.old_password = ''
  passwordErrors.new_password = ''
  let ok = true

  // Aturan password awal mengikuti reset admin: siswa = NISN, guru/admin = username.
  // Password baru tidak boleh sama dengan password awal tersebut.
  const initialPassword = isSiswa.value ? currentNisn.value : currentUsername.value

  if (!passwordForm.old_password) {
    passwordErrors.old_password = 'Password lama wajib diisi.'
    ok = false
  }
  if (!passwordForm.new_password) {
    passwordErrors.new_password = 'Password baru wajib diisi.'
    ok = false
  } else if (passwordForm.new_password.length < 5) {
    passwordErrors.new_password = 'Password baru minimal 5 karakter.'
    ok = false
  } else if (initialPassword && passwordForm.new_password === initialPassword) {
    passwordErrors.new_password = isSiswa.value
      ? 'Password baru tidak boleh sama dengan NISN.'
      : 'Password baru tidak boleh sama dengan username.'
    ok = false
  } else if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
    passwordErrors.new_password = 'Konfirmasi password baru tidak cocok.'
    ok = false
  }
  if (!ok) return

  isChangingPassword.value = true
  try {
    await api.post('/users/change-password', {
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
      new_password_confirmation: passwordForm.new_password_confirmation,
    })
    authStore.clearMustChangePassword()
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirmation = ''
    toastStore.show('Password berhasil diubah!', 'success')

    // Setelah flag lunas, arahkan sesuai role: siswa ke landing page,
    // admin/guru ke dashboard.
    if (isSiswa.value) {
      router.push('/')
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (err: unknown) {
    const apiErr = err as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    const fieldErrors = apiErr.response?.data?.errors
    if (fieldErrors) {
      if (fieldErrors.old_password?.[0]) passwordErrors.old_password = fieldErrors.old_password[0]
      if (fieldErrors.new_password?.[0]) passwordErrors.new_password = fieldErrors.new_password[0]
    }
    toastStore.show(apiErr.response?.data?.message || 'Gagal mengubah password.', 'error')
  } finally {
    isChangingPassword.value = false
  }
}

const backTarget = computed(() => (isSiswa.value ? '/' : '/dashboard'))
const backTargetLabel = computed(() => (isSiswa.value ? 'Beranda' : 'Dashboard'))

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    toastStore.show('Logout berhasil!', 'success')
    router.push('/')
  } catch {
    toastStore.show('Gagal keluar dari akun.', 'error')
  } finally {
    isLoggingOut.value = false
  }
}

onMounted(() => {
  siteDataStore.fetchGlobalConfig()
  fetchMe()
})

onUnmounted(() => {
  // tidak ada listener global di halaman ini
})
</script>

<template>
  <div class="min-h-screen w-full bg-secondary/20">
    <!-- Topbar mandiri -->
    <header
      class="h-16 bg-neutral border-b border-secondary px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40"
    >
      <div class="flex items-center gap-3 min-w-0">
        <img :src="logoImg" alt="Logo" class="w-8 h-8 shrink-0" />
        <div class="leading-tight min-w-0">
          <p
            class="font-bold text-sm text-text-neutral wrap-break-word line-clamp-1 uppercase"
            :title="schoolName"
          >
            {{ schoolName }}
          </p>
          <p class="text-[11px] text-text-alt mt-0.5">Profil Saya</p>
        </div>
      </div>

      <div class="flex items-center shrink-0">
        <AdminButton
          size="sm"
          variant="secondary"
          label="Logout"
          :icon-left="RiLogoutBoxRLine"
          :disabled="isLoggingOut"
          @click="handleLogout"
        />
      </div>
    </header>

    <LoadingSpinner v-if="isLoggingOut" :overlay="true" size="xl" label="Mengeluarkan akun..." />

    <!-- Konten -->
    <main class="p-4 sm:p-6">
      <div class="flex flex-col gap-4 max-w-4xl mx-auto">
        <!-- Tombol kembali (di bawah header, full-width di mobile) -->
        <div
          :class="mustChangePassword ? 'opacity-40 pointer-events-none select-none' : ''"
          :title="
            mustChangePassword
              ? 'Ganti password dulu sebelum kembali'
              : isSiswa
                ? 'Kembali ke beranda'
                : 'Kembali ke dashboard'
          "
        >
          <BackButton
            :to="backTarget"
            :label="backTargetLabel"
            :sticky="false"
            class="w-full sm:w-auto justify-start"
          />
        </div>
        <!-- NOTE: BackButton selalu render <button>, jadi status terkunci
             (wajib ganti password) diwakili wrapper di atas: abu + non-klik. -->

        <!-- Banner wajib ganti password -->
        <div
          v-if="mustChangePassword"
          class="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3.5"
        >
          <RiLockPasswordLine class="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="font-semibold text-text-neutral">
              Anda wajib mengganti password terlebih dahulu.
            </p>
            <p class="text-text-alt mt-0.5">
              {{ isSiswa ? `Password awal Anda masih sama dengan NISN (${currentNisn || '-'})` : `Password awal Anda masih sama dengan username (${currentUsername || '-'})` }}.
              Ganti dengan password baru di form bawah agar bisa mengakses halaman lain.
            </p>
          </div>
        </div>

        <!-- Kartu profil -->
        <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
          <div class="border-b border-text-alt/50 pb-4 mb-6">
            <h1 class="text-xl font-bold text-text-neutral">Profil Saya</h1>
            <p class="text-sm text-text-alt mt-1">
              {{ user?.role_name || 'Pengguna' }} • @{{ user?.username }}
              <span v-if="user?.nisn"> • NISN {{ user.nisn }}</span>
            </p>
          </div>

          <div v-if="isLoadingProfile" class="py-10 text-center">
            <LoadingSpinner size="lg" label="Memuat data profil..." />
          </div>

          <form v-else @submit.prevent="handleSaveProfile" class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
                <span>Nama Lengkap</span>
                <RequiredBadge />
              </label>
              <Input
                v-model="profileForm.fullname"
                variant="semi-rounded"
                maxlength="255"
                placeholder="Masukkan nama lengkap..."
                :error="!!profileErrors.fullname"
                @input="profileErrors.fullname = ''"
              />
              <p v-if="profileErrors.fullname" class="text-sm text-error mt-1">
                {{ profileErrors.fullname }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
                  <span>Username</span>
                  <RequiredBadge />
                </label>
                <Input
                  v-model="profileForm.username"
                  variant="semi-rounded"
                  maxlength="100"
                  placeholder="Masukkan username..."
                  :error="!!profileErrors.username"
                  @input="profileErrors.username = ''"
                />
                <p v-if="profileErrors.username" class="text-sm text-error mt-1">
                  {{ profileErrors.username }}
                </p>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-neutral mb-1.5">Email <span class="text-text-alt">(Disarankan mengisi)</span></label>
                <Input
                  v-model="profileForm.email"
                  type="email"
                  variant="semi-rounded"
                  maxlength="255"
                  placeholder="Masukkan email..."
                  :error="!!profileErrors.email"
                  @input="profileErrors.email = ''"
                />
                <p v-if="profileErrors.email" class="text-sm text-error mt-1">
                  {{ profileErrors.email }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <AdminButton
                type="submit"
                size="md"
                variant="primary"
                :label="isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'"
                :disabled="isSavingProfile"
                :icon-left="RiSaveLine"
              />
            </div>
          </form>
        </div>

        <!-- Kartu ganti password -->
        <div class="bg-neutral rounded-2xl shadow-sm p-6 sm:p-8">
          <div class="border-b border-text-alt/50 pb-4 mb-6">
            <h2 class="text-lg font-bold text-text-neutral">Ganti Password</h2>
            <p class="text-sm text-text-alt mt-1">{{ passwordHint }}</p>
          </div>

          <form @submit.prevent="handleChangePassword" class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
                <span>Password Lama</span>
                <RequiredBadge />
              </label>
              <Input
                v-model="passwordForm.old_password"
                type="password"
                variant="semi-rounded"
                placeholder="Masukkan password lama..."
                :error="!!passwordErrors.old_password"
                @input="passwordErrors.old_password = ''"
              />
              <p v-if="passwordErrors.old_password" class="text-sm text-error mt-1">
                {{ passwordErrors.old_password }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <label class="flex items-center text-sm font-medium text-text-neutral mb-1.5">
                  <span>Password Baru</span>
                  <RequiredBadge />
                </label>
                <Input
                  v-model="passwordForm.new_password"
                  type="password"
                  variant="semi-rounded"
                  placeholder="Minimal 5 karakter..."
                  :error="!!passwordErrors.new_password"
                  @input="passwordErrors.new_password = ''"
                />
                <p v-if="passwordErrors.new_password" class="text-sm text-error mt-1">
                  {{ passwordErrors.new_password }}
                </p>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-neutral mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <Input
                  v-model="passwordForm.new_password_confirmation"
                  type="password"
                  variant="semi-rounded"
                  placeholder="Ulangi password baru..."
                  :error="!!passwordErrors.new_password"
                  @input="passwordErrors.new_password = ''"
                />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <AdminButton
                type="submit"
                size="md"
                variant="primary"
                :label="isChangingPassword ? 'Menyimpan...' : 'Ganti Password'"
                :disabled="isChangingPassword"
                :icon-left="RiLockPasswordLine"
              />
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
