<template>
  <span :title="fraUtil.basic.formatUtc(value, titleFormat)">
    {{ fraUtil.basic.formatUtc(value, labelFormat) }}
  </span>
</template>

<script lang="tsx" setup>
import { util as fraUtil } from '@sunny-framework-js/core'

withDefaults(
  defineProps<{
    value: string
    titleFormat?: string
    labelFormat?: string
  }>(),
  {
    labelFormat: 'MMM D, HH:mm [GMT]Z',
  },
)
</script>