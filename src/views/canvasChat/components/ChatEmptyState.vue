<script setup lang="ts">
import {
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import {
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Clock3, CloudSun, PenLine, Sparkles } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'select', text: string): void
}>()

const quickTips = [
  {
    icon: Clock3,
    title: '时间查询',
    prompt: '现在几点了？',
  },
  {
    icon: CloudSun,
    title: '天气参考',
    prompt: '北京天气怎么样？',
  },
  {
    icon: PenLine,
    title: '文本统计',
    prompt: '帮我统计字数：Hello 你好世界',
  },
]
</script>

<template>
  <ConversationEmptyState class="flex-1 px-3 py-6">
    <div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
      <div
        class="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-sm"
      >
        <Sparkles class="size-5 text-emerald-200" />
      </div>

      <div class="space-y-3">
        <h1 class="text-xl font-semibold text-foreground">
          有什么可以帮你的？
        </h1>
        <p class="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
          输入场景、画面、角色或参考目标，我会帮你把想法整理成更清晰的方向。
        </p>
      </div>

      <Suggestions class="mx-auto grid w-full max-w-2xl grid-cols-1 gap-2">
      <Suggestion
        v-for="tip in quickTips"
        :key="tip.prompt"
        :suggestion="tip.prompt"
        variant="outline"
        class="h-auto min-h-[72px] justify-start whitespace-normal rounded-xl border-white/10 bg-white/[0.035] px-3 py-2.5 text-left text-foreground/90 shadow-sm transition hover:border-white/20 hover:bg-white/[0.07]"
        @click="emit('select', tip.prompt)"
      >
        <span class="flex w-full flex-col gap-2">
          <span class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <component :is="tip.icon" class="size-4 text-emerald-200" />
            {{ tip.title }}
          </span>
          <span class="text-sm leading-5 text-foreground">
            {{ tip.prompt }}
          </span>
        </span>
      </Suggestion>
      </Suggestions>
    </div>
  </ConversationEmptyState>
</template>
