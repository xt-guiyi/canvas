<template>
  <div class="video-node-controls pointer-events-none absolute inset-0 z-10 flex flex-col">
    <!-- 左上：静音 -->
    <button
      type="button"
      class="video-node-controls__mute nodrag nopan pointer-events-auto absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
      :title="isMuted ? '取消静音' : '静音'"
      @mousedown.stop
      @click.stop="toggleMute"
    >
      <svg v-if="isMuted" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        <path d="M15 9l4 4M19 9l-4 4" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        <path d="M15 9a3 3 0 0 1 0 6" stroke-linecap="round" />
      </svg>
    </button>

    <!-- 底部：播放 | 当前时间 | 进度条 | 总时长 | 全屏 -->
    <div
      class="video-node-controls__bar nodrag nopan pointer-events-auto mt-auto bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4"
      @mousedown.stop
      @click.stop
    >
      <div class="flex min-w-0 items-center gap-1">
        <button
          type="button"
          class="flex h-5 w-5 shrink-0 items-center justify-center text-white"
          :title="isPlaying ? '暂停' : '播放'"
          @click.stop="togglePlay"
        >
          <svg v-if="isPlaying" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
            <rect x="6" y="5" width="3" height="14" rx="0.5" />
            <rect x="15" y="5" width="3" height="14" rx="0.5" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="11" height="11" fill="currentColor" class="ml-px">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <span class="shrink-0 text-[10px] leading-none tabular-nums text-white/95">
          {{ formatTime(currentTime) }}
        </span>

        <div class="relative h-3 min-w-0 flex-1">
          <div class="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/30">
            <div
              class="h-full rounded-full bg-white"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <input
            v-model.number="seekValue"
            type="range"
            class="video-node-controls__range absolute inset-0 h-full w-full cursor-pointer opacity-0"
            min="0"
            :max="duration || 0"
            step="0.01"
            @input="onSeek"
          />
          <div
            class="pointer-events-none absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-sm"
            :style="{ left: `clamp(0px, calc(${progressPercent}% - 4px), calc(100% - 8px))` }"
          />
        </div>

        <span class="shrink-0 text-[10px] leading-none tabular-nums text-white/95">
          {{ formatTime(duration) }}
        </span>

        <button
          type="button"
          class="flex h-5 w-5 shrink-0 items-center justify-center text-white"
          title="全屏"
          @click.stop="toggleFullscreen"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  video: HTMLVideoElement | null
  container: HTMLElement | null
}>()

const isPlaying = ref(false)
const isMuted = ref(true)
const currentTime = ref(0)
const duration = ref(0)
const seekValue = ref(0)

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0.0'
  return seconds.toFixed(1)
}

function syncFromVideo(video: HTMLVideoElement) {
  isPlaying.value = !video.paused
  isMuted.value = video.muted
  currentTime.value = video.currentTime
  duration.value = video.duration || 0
  seekValue.value = video.currentTime
}

function togglePlay() {
  const video = props.video
  if (!video) return
  if (video.paused) void video.play()
  else video.pause()
}

function toggleMute() {
  const video = props.video
  if (!video) return
  video.muted = !video.muted
  isMuted.value = video.muted
}

function onSeek() {
  const video = props.video
  if (!video) return
  video.currentTime = seekValue.value
  currentTime.value = seekValue.value
}

async function toggleFullscreen() {
  const target = props.container ?? props.video
  if (!target) return
  if (document.fullscreenElement) {
    await document.exitFullscreen()
    return
  }
  await target.requestFullscreen()
}

let boundVideo: HTMLVideoElement | null = null

function bindVideo(video: HTMLVideoElement) {
  unbindVideo()
  boundVideo = video
  syncFromVideo(video)

  video.addEventListener('timeupdate', onTimeUpdate)
  video.addEventListener('loadedmetadata', onLoadedMetadata)
  video.addEventListener('durationchange', onLoadedMetadata)
  video.addEventListener('play', onPlay)
  video.addEventListener('pause', onPause)
}

function unbindVideo() {
  if (!boundVideo) return
  boundVideo.removeEventListener('timeupdate', onTimeUpdate)
  boundVideo.removeEventListener('loadedmetadata', onLoadedMetadata)
  boundVideo.removeEventListener('durationchange', onLoadedMetadata)
  boundVideo.removeEventListener('play', onPlay)
  boundVideo.removeEventListener('pause', onPause)
  boundVideo = null
}

function onTimeUpdate() {
  if (!boundVideo) return
  currentTime.value = boundVideo.currentTime
  seekValue.value = boundVideo.currentTime
}

function onLoadedMetadata() {
  if (!boundVideo) return
  duration.value = boundVideo.duration || 0
  seekValue.value = boundVideo.currentTime
}

function onPlay() {
  isPlaying.value = true
}

function onPause() {
  isPlaying.value = false
}

watch(
  () => props.video,
  video => {
    if (video) bindVideo(video)
    else unbindVideo()
  },
  { immediate: true },
)

onUnmounted(unbindVideo)
</script>
