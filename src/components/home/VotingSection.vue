<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import VoteCard from '@/components/cards/VoteCard.vue'
import Button from '@/components/ui/Button.vue'
import { RiArrowRightUpLine } from '@remixicon/vue'

const store = useSiteDataStore()
const { highlightVoting } = storeToRefs(store)

const votingTitle = computed(() => highlightVoting.value?.title ?? '')
const votingDescription = computed(() => highlightVoting.value?.description ?? '')
const startDate = computed(() => highlightVoting.value?.start_date ?? '')
const endDate = computed(() => highlightVoting.value?.end_date ?? '')
const candidates = computed(() => highlightVoting.value?.candidates ?? [])

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const router = useRouter()

const goToDetail = () => {
  router.push(isAuthenticated.value ? '/voting-detail' : '/login')
}

const toastStore = useToastStore()

const handleVotingCenter = () => {
  if (!isAuthenticated.value) {
    toastStore.show('Silakan login terlebih dahulu untuk mengakses Voting', 'info')
    router.push('/login')
    return
  }
  router.push('/voting')
}

const handleVotingDetail = () => {
  if (!isAuthenticated.value) {
    toastStore.show('Silakan login terlebih dahulu untuk mengakses Voting', 'info')
    router.push('/login')
    return
  }
  router.push('/voting-detail')
}

onMounted(() => {
  store.fetchGlobalConfig()
})
</script>

<template>
  <section
    v-if="highlightVoting"
    class="bg-linear-to-br from-primary to-accent px-6 py-10 flex flex-col items-center gap-8 sm:px-12 sm:py-16 sm:gap-12"
  >
    <div class="flex flex-col items-center gap-3 text-center sm:gap-4">
      <div class="flex flex-row items-center gap-2 sm:gap-4">
        <span
          class="bg-neutral text-primary font-bold px-4 py-1.5 rounded-xl text-sm sm:px-6 sm:py-2 sm:rounded-2xl sm:text-base"
        >
          Highlight Voting
        </span>
        <span class="text-neutral font-bold text-sm sm:text-base"
          >{{ startDate }} - {{ endDate }}</span
        >
      </div>

      <h2 class="font-extrabold text-2xl text-neutral sm:text-4xl">{{ votingTitle }}</h2>
      <p class="text-neutral text-sm max-w-2xl px-4 sm:text-lg sm:px-0">
        {{ votingDescription }}
      </p>
    </div>

    <div
      class="flex flex-col items-start gap-4 w-full max-w-90 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 lg:w-auto lg:gap-8"
    >
      <VoteCard
        @click="handleVotingDetail"
        v-for="item in candidates"
        :key="item.id"
        :order="item.order"
        :title="item.title"
        :description="item.description"
        :img-cover="item.img_cover"
        :vote-count="0"
        :percentage="0"
      />
    </div>

    <Button
      label="Pusat Voting"
      variant="neutral"
      :icon-right="RiArrowRightUpLine"
      @click="handleVotingCenter"
    />
  </section>
</template>
