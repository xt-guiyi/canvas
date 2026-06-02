<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { History, Settings, SquarePen, X } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'open-history'): void
  (e: 'new-chat'): void
  (e: 'close'): void
}>()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between gap-2 bg-background px-3">
    <h2 class="truncate text-base font-semibold text-white/72">任务</h2>

    <div class="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded-lg text-white/55 hover:bg-white/[0.06] hover:text-white/85"
            aria-label="历史记录"
            @click="emit('open-history')"
          >
            <History class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>历史记录</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded-lg text-white/55 hover:bg-white/[0.06] hover:text-white/85"
            aria-label="设置"
          >
            <Settings class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>设置</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded-lg text-white/55 hover:bg-white/[0.06] hover:text-white/85"
            aria-label="新建会话"
            @click="emit('new-chat')"
          >
            <SquarePen class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>新建会话</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded-lg text-white/55 hover:bg-white/[0.06] hover:text-white/85"
            aria-label="关闭"
            @click="emit('close')"
          >
            <X class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>关闭</TooltipContent>
      </Tooltip>
    </div>
  </header>
</template>
