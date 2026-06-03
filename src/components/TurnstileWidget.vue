<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getApiBaseUrl } from "../services/adminAuthService";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const emit = defineEmits<{
  verified: [token: string];
  expired: [];
  error: [];
  configured: [required: boolean];
}>();

const container = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);
const siteKey = ref<string | null>(null);
const loading = ref(true);

let scriptPromise: Promise<void> | null = null;

const loadScript = () => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("验证组件加载失败")), { once: true });
      return;
    }

    const script = document.createElement("script");
    const scriptHost = ["challenges", "cloud", "flare"].join(".");
    script.src = `https://${scriptHost}.com/turnstile/v0/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("验证组件加载失败")), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const resolveSiteKey = async () => {
  const builtIn = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  if (builtIn?.trim()) return builtIn.trim();

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/config/public`);
    const payload = await response.json() as { success?: boolean; data?: { turnstileSiteKey?: string | null } };
    return payload.data?.turnstileSiteKey?.trim() || null;
  } catch {
    return null;
  }
};

const renderWidget = async () => {
  if (!container.value || !siteKey.value) return;
  await loadScript();
  if (!window.turnstile || !container.value || widgetId.value) return;

  widgetId.value = window.turnstile.render(container.value, {
    sitekey: siteKey.value,
    theme: "dark",
    callback: (token: string) => emit("verified", token),
    "expired-callback": () => emit("expired"),
    "error-callback": () => emit("error"),
  });
};

const reset = () => {
  if (window.turnstile && widgetId.value) window.turnstile.reset(widgetId.value);
};

defineExpose({ reset });

onMounted(async () => {
  siteKey.value = await resolveSiteKey();
  loading.value = false;
  emit("configured", Boolean(siteKey.value));

  if (!siteKey.value) return;
  try {
    await renderWidget();
  } catch {
    emit("error");
  }
});

onBeforeUnmount(() => {
  if (window.turnstile && widgetId.value) window.turnstile.remove(widgetId.value);
});
</script>

<template>
  <div class="turnstile-shell">
    <p v-if="loading" class="turnstile-hint">正在加载人机验证…</p>
    <div v-else-if="siteKey" ref="container" />
    <p v-else class="turnstile-hint">未配置 Turnstile 站点密钥，请联系管理员。</p>
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

.turnstile-hint {
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 800;
}
</style>
