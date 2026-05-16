<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const emit = defineEmits<{
  verified: [token: string]
  expired: []
  error: []
}>()

const container = ref<HTMLElement | null>(null)
const widgetId = ref<string | null>(null)
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

let scriptPromise: Promise<void> | null = null

const loadScript = () => {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('验证组件 加载失败')), { once: true })
      return
    }

    const script = document.createElement('script')
    const scriptHost = ['challenges', 'cloud', 'flare'].join('.')
    script.src = `https://${scriptHost}.com/turnstile/v0/api.js?render=explicit`
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('验证组件 加载失败')), { once: true })
    document.head.appendChild(script)
  })

  return scriptPromise
}

const renderWidget = async () => {
  if (!container.value || !siteKey) return
  await loadScript()
  if (!window.turnstile || !container.value || widgetId.value) return

  widgetId.value = window.turnstile.render(container.value, {
    sitekey: siteKey,
    theme: 'dark',
    callback: (token: string) => emit('verified', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  })
}

const reset = () => {
  if (window.turnstile && widgetId.value) window.turnstile.reset(widgetId.value)
}

defineExpose({ reset })

onMounted(() => {
  renderWidget().catch(() => emit('error'))
})

onBeforeUnmount(() => {
  if (window.turnstile && widgetId.value) window.turnstile.remove(widgetId.value)
})
</script>

<template>
  <div class="turnstile-shell">
    <div v-if="siteKey" ref="container"></div>
    <p v-else>需要配置 VITE_TURNSTILE_SITE_KEY 才能启用防刷验证。</p>
  </div>
</template>

<style scoped>
.turnstile-shell {
  min-height: 66px;
  display: grid;
  align-items: center;
  justify-items: start;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.2);
}

.turnstile-shell p {
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 800;
}
</style>
