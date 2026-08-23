<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  animationData: { type: String, required: true },
  autoplay: { type: Boolean, default: true },
  loop: { type: Boolean, default: true },
  speed: { type: Number, default: 1 },
  label: { type: String, default: '' },
})

const emit = defineEmits(['complete', 'ready'])
const canvas = ref(null)
const status = ref('loading')
let player
let completionFrame
let completionTimer
let playbackFinished = false
let playbackStarted = false

function decodeBase64(value) {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

function finishPlayback() {
  if (playbackFinished || props.loop) return
  playbackFinished = true
  window.clearTimeout(completionTimer)
  if (player?.totalFrames) player.setFrame(Math.max(0, player.totalFrames - 1))
  status.value = 'complete'
  completionFrame = window.requestAnimationFrame(() => emit('complete'))
}

function startPlayback() {
  if (playbackStarted || !player?.isLoaded) return
  playbackStarted = true
  status.value = 'ready'
  player.setSpeed(props.speed)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const shouldAutoplay = props.autoplay && !reduceMotion
  if (shouldAutoplay) player.play()
  if (shouldAutoplay && !props.loop && player.duration > 0) {
    completionTimer = window.setTimeout(finishPlayback, (player.duration / props.speed) * 1000)
  } else if (reduceMotion && !props.loop) {
    // 모션을 줄인 환경에서는 마지막 장면만 잠시 보여 주고 다음 화면으로 넘어갑니다.
    completionTimer = window.setTimeout(finishPlayback, 900)
  }
  emit('ready')
}

onMounted(async () => {
  try {
    const [{ DotLottie }, { default: wasmUrl }] = await Promise.all([
      import('@lottiefiles/dotlottie-web'),
      import('@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'),
    ])
    DotLottie.setWasmUrl(wasmUrl)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    player = new DotLottie({
      canvas: canvas.value,
      data: decodeBase64(props.animationData),
      autoplay: false,
      loop: props.loop && !reduceMotion,
      backgroundColor: 'transparent',
      layout: { fit: 'contain', align: [0.5, 0.5] },
      renderConfig: { autoResize: true, freezeOnOffscreen: true, quality: 88 },
    })
    player.addEventListener('ready', startPlayback)
    player.addEventListener('load', startPlayback)
    player.addEventListener('complete', finishPlayback)
    player.addEventListener('loadError', () => {
      status.value = 'error'
    })
    player.addEventListener('renderError', () => {
      status.value = 'error'
    })
  } catch {
    status.value = 'error'
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(completionTimer)
  window.cancelAnimationFrame(completionFrame)
  player?.destroy()
})
</script>

<template>
  <div class="lottie-canvas" :class="`is-${status}`" role="img" :aria-label="label">
    <canvas ref="canvas"></canvas>
    <span v-if="status === 'loading'" class="motion-fallback" aria-hidden="true">✦</span>
    <span v-else-if="status === 'error'" class="motion-fallback is-error" aria-hidden="true"
      >☁</span
    >
  </div>
</template>

<style scoped>
.lottie-canvas {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 180ms ease-out;
}

.lottie-canvas.is-ready canvas,
.lottie-canvas.is-complete canvas {
  opacity: 1;
}

.motion-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-size: 30px;
  animation: fallback-pulse 900ms ease-in-out infinite alternate;
}

.motion-fallback.is-error {
  animation: none;
  color: var(--muted);
}

@keyframes fallback-pulse {
  to {
    opacity: 0.35;
    transform: scale(0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  canvas {
    transition: none;
  }

  .motion-fallback {
    animation: none;
  }
}
</style>
