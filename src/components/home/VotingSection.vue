<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteDataStore } from '@/stores/siteData'
import { useRouter } from 'vue-router'
import VoteCard from '@/components/cards/VoteCard.vue'
import Button from '@/components/ui/Button.vue'
import { RiArrowRightUpLine } from '@remixicon/vue'

const store = useSiteDataStore()
const router = useRouter()
const { highlightVoting } = storeToRefs(store)

const votingTitle = computed(() => highlightVoting.value?.title ?? '')
const votingDescription = computed(() => highlightVoting.value?.description ?? '')
const startDate = computed(() => highlightVoting.value?.start_date ?? '')
const endDate = computed(() => highlightVoting.value?.end_date ?? '')
const candidates = computed(() => highlightVoting.value?.candidates ?? [])

onMounted(() => {
  store.fetchGlobalConfig()
})
</script>

<template>
  <section
    v-if="highlightVoting"
    class="bg-linear-to-br from-primary to-accent px-12 py-16 flex flex-col items-center gap-12"
  >
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="flex items-center gap-4">
        <span class="bg-neutral text-primary font-bold px-6 py-2 rounded-2xl">
          Highlight Voting
        </span>
        <span class="text-neutral font-bold">{{ startDate }} - {{ endDate }}</span>
      </div>

      <h2 class="font-extrabold text-4xl text-neutral">{{ votingTitle }}</h2>
      <p class="text-neutral text-lg max-w-2xl">{{ votingDescription }}</p>
    </div>

    <div class="flex flex-wrap justify-center gap-8">
      <VoteCard
        @click="router.push('/voting-detail')"
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
      @click="router.push('/voting')"
    />
  </section>
</template>
