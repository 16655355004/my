<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
const loadError = ref<string | null>(null);

let scriptPromise: Promise<void> | null = null;

const loadScript = () => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
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

const mountWidget = async () => {
  if (!siteKey.value || widgetId.value) return;

  loadError.value = null;
  await nextTick();

  if (!container.value) {
    loadError.value = "验证区域未就绪，请刷新页面重试";
    emit("error");
    return;
  }

  try {
    await loadScript();
    if (!window.turnstile || !container.value) {
      loadError.value = "验证脚本加载失败，请检查网络或广告拦截插件";
      emit("error");
      return;
    }

    widgetId.value = window.turnstile.render(container.value, {
      sitekey: siteKey.value,
      theme: "dark",
      callback: (token: string) => emit("verified", token),
      "expired-callback": () => emit("expired"),
      "error-callback": () => {
        loadError.value = "人机验证加载失败，请刷新重试";
        emit("error");
      },
    });
  } catch {
    loadError.value = "验证组件初始化失败，请刷新页面";
    emit("error");
  }
};

const reset = () => {
  if (window.turnstile && widgetId.value) window.turnstile.reset(widgetId.value);
};

defineExpose({ reset });

onMounted(async () => {
  siteKey.value = await resolveSiteKey();
  loading.value = false;
  emit("configured", Boolean(siteKey.value));

  if (siteKey.value) await mountWidget();
});

watch(container, (element) => {
  if (element && siteKey.value && !widgetId.value && !loading.value) {
    mountWidget();
  }
});

onBeforeUnmount(() => {
  if (window.turnstile && widgetId.value) window.turnstile.remove(widgetId.value);
});
</script>

<template>
  <div class="turnstile-shell">
    <p v-if="loading" class="turnstile-hint">正在加载人机验证…</p>
    <template v-else-if="siteKey">
      <div ref="container" class="turnstile-slot" />
      <p v-if="loadError" class="turnstile-hint turnstile-hint--error">{{ loadError }}</p>
    </template>
    <p v-else class="turnstile-hint">未配置 Turnstile 站点密钥，请在 Cloudflare 添加 TURNSTILE_SITE_KEY 后重新部署。</p>
  </div>
</template>

<style scoped>
.turnstile-shell {
  min-height: 78px;
  display: grid;
  align-items: center;
  justify-items: start;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.2);
}

.turnstile-slot {
  min-height: 65px;
  min-width: 300px;
}

.turnstile-hint {
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 800;
}

.turnstile-hint--error {
  color: var(--accent-3);
}
</style>
