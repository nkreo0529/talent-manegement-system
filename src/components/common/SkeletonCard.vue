<script setup lang="ts">
interface Props {
  lines?: number
  showAvatar?: boolean
}

withDefaults(defineProps<Props>(), {
  lines: 3,
  showAvatar: false,
})
</script>

<template>
  <div class="card animate-pulse">
    <div class="flex items-start space-x-4">
      <!-- Avatar skeleton -->
      <div
        v-if="showAvatar"
        class="skeleton w-12 h-12 rounded-full shrink-0"
      ></div>

      <div class="flex-1 space-y-3">
        <!-- Title skeleton -->
        <div class="skeleton h-5 w-3/4 rounded"></div>

        <!-- Content lines -->
        <div
          v-for="i in lines"
          :key="i"
          class="skeleton h-4 rounded"
          :class="{
            'w-full': i < lines,
            'w-2/3': i === lines,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>
