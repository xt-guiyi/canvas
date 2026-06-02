<script setup lang="ts">
import {
  Tool,
  ToolHeader,
  ToolContent,
} from '@/components/ai-elements/tool'
import { CodeBlock } from '@/components/ai-elements/code-block'
import type { ToolEvent } from '@/types/chat'
import { computed } from 'vue'

interface Props {
  event: ToolEvent
}

const props = defineProps<Props>()

const toolState = computed(() =>
  props.event.type === 'tool-call' ? 'input-available' : 'output-available',
)

const toolType = computed(() => 'dynamic-tool' as const)

const formattedArgs = computed(() =>
  props.event.args ? JSON.stringify(props.event.args, null, 2) : '',
)
</script>

<template>
  <Tool
    :default-open="event.expanded"
    class="overflow-hidden rounded-xl border-white/10 bg-white/[0.035]"
  >
    <ToolHeader
      :type="toolType"
      :state="toolState"
      :tool-name="event.toolName"
      :title="event.toolName"
    />
    <ToolContent>
      <div class="space-y-4 p-4">
        <!-- Parameters -->
        <div v-if="formattedArgs" class="space-y-2">
          <h4 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            参数
          </h4>
          <CodeBlock :code="formattedArgs" language="json" />
        </div>

        <!-- Result -->
        <div v-if="event.result" class="space-y-2">
          <h4 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            结果
          </h4>
          <CodeBlock :code="event.result" language="json" />
        </div>
      </div>
    </ToolContent>
  </Tool>
</template>
