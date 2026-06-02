<script setup lang="ts">
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputButton,
} from '@/components/ai-elements/prompt-input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input/types'
import { Brain } from 'lucide-vue-next'
import ChatInputAttachments from './ChatInputAttachments.vue'

const emit = defineEmits<{
  (e: 'submit', payload: PromptInputMessage): void
  (e: 'toggleThinkingMode'): void
}>()

interface Props {
  status?: 'ready' | 'streaming'
  thinkingMode?: boolean
}

withDefaults(defineProps<Props>(), {
  status: 'ready',
  thinkingMode: false,
})
</script>

<template>
  <div
    class="shrink-0 border-white/10 bg-background/95 px-2 pb-2 pt-2 backdrop-blur"
  >
    <div class="mx-auto w-full max-w-4xl">
    <PromptInput
      multiple
      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
      :max-files="8"
      :convert-files-to-data-urls="false"
      class="overflow-visible rounded-2xl border border-white/12 bg-white/[0.055] shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
      @submit="emit('submit', $event)"
    >
      <ChatInputAttachments />

      <PromptInputBody>
        <PromptInputTextarea
          placeholder="描述你的场景、问题或参考目标..."
          class="min-h-16 resize-none bg-transparent px-3 pt-3 pb-2 text-sm leading-6 text-foreground placeholder:text-muted-foreground/55"
        />
      </PromptInputBody>

      <PromptInputFooter class="flex flex-wrap items-center justify-between gap-1 px-1.5 pb-1.5 pt-1">
        <div class="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <PromptInputButton
                :aria-pressed="thinkingMode"
                :class="[
                  'h-8 rounded-lg px-2 text-xs transition-colors',
                  thinkingMode
                    ? 'border border-emerald-300/30 bg-emerald-300/12 text-emerald-100 hover:bg-emerald-300/18'
                    : 'text-muted-foreground hover:bg-white/[0.07] hover:text-foreground',
                ]"
                size="sm"
                variant="ghost"
                @click="emit('toggleThinkingMode')"
              >
                <Brain class="size-4" />
                <span>思考</span>
              </PromptInputButton>
            </TooltipTrigger>
            <TooltipContent side="top">
              {{ thinkingMode ? '关闭思考模式' : '开启思考模式' }}
            </TooltipContent>
          </Tooltip>

          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              variant="ghost"
              size="icon-sm"
              class="size-8 rounded-lg text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
            />
            <PromptInputActionMenuContent
              class="border-white/12 bg-[#17191d] text-white shadow-[0_18px_50px_rgba(0,0,0,0.42)]"
            >
              <PromptInputActionAddAttachments
                label="添加附件"
                class="cursor-pointer rounded-md text-white/82 focus:bg-white/[0.08] focus:text-white"
              />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </div>

        <div class="flex items-center gap-1">
          <PromptInputSubmit
            :status="status"
            class="size-8 rounded-lg bg-foreground text-background shadow-sm hover:bg-foreground/90 disabled:opacity-40"
          />
        </div>
      </PromptInputFooter>
    </PromptInput>
    </div>
  </div>
</template>
