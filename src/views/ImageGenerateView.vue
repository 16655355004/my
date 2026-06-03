<script setup lang="ts">
import { computed, ref } from "vue";
import TurnstileWidget from "../components/TurnstileWidget.vue";
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_IMAGE_QUALITY,
  IMAGE_ASPECT_RATIOS,
  IMAGE_MODELS,
  IMAGE_QUALITY_OPTIONS,
} from "../constant/media";
import imageGenerateService, { type GeneratedImage } from "../services/imageGenerateService";

const prompt = ref("");
const negativePrompt = ref("");
const model = ref(DEFAULT_IMAGE_MODEL);
const aspectRatio = ref(DEFAULT_ASPECT_RATIO);
const quality = ref(DEFAULT_IMAGE_QUALITY);
const generating = ref(false);
const error = ref<string | null>(null);
const result = ref<GeneratedImage | null>(null);
const turnstileToken = ref("");

const selectedModel = computed(() => IMAGE_MODELS.find((item) => item.value === model.value));
const promptLength = computed(() => prompt.value.trim().length);

const onTurnstileVerified = (token: string) => {
  turnstileToken.value = token;
};

const onTurnstileExpired = () => {
  turnstileToken.value = "";
};

const generate = async () => {
  generating.value = true;
  error.value = null;
  result.value = null;

  const response = await imageGenerateService.generateImage({
    prompt: prompt.value,
    negativePrompt: negativePrompt.value || undefined,
    model: model.value,
    aspectRatio: aspectRatio.value,
    quality: quality.value,
    turnstileToken: turnstileToken.value || undefined,
  });

  if (response.success && response.data) {
    result.value = response.data;
  } else {
    error.value = response.error || "生成失败";
  }

  generating.value = false;
};

const downloadResult = () => {
  if (!result.value?.url) return;
  const link = document.createElement("a");
  link.href = result.value.url;
  link.download = `kongkong-${Date.now()}.png`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
};
</script>

<template>
  <main class="generate-page page-shell">
    <div class="ambient" aria-hidden="true">
      <span class="ambient-orb ambient-orb--violet" />
      <span class="ambient-orb ambient-orb--amber" />
    </div>

    <div class="container">
      <header class="page-hero">
        <div class="hero-copy">
          <span class="page-tag">Generate</span>
          <h1 class="page-title">AI 生图工作室</h1>
          <p class="page-sub">
            用一句话描述画面，选择模型与比例，生成带二次元气质的插画。通常需要 10–60 秒，请耐心等待。
          </p>
        </div>

        <div class="hero-metrics">
          <div class="metric-card panel">
            <span>可选模型</span>
            <strong>{{ IMAGE_MODELS.length }}</strong>
          </div>
          <div class="metric-card panel">
            <span>当前模型</span>
            <strong class="metric-model">{{ selectedModel?.label || "—" }}</strong>
          </div>
        </div>
      </header>

      <div class="workspace">
        <form class="control-panel panel" @submit.prevent="generate">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Compose</span>
              <h2>描述画面</h2>
            </div>
            <span class="char-count" :class="{ warn: promptLength > 800 }">{{ promptLength }} / 1000</span>
          </div>

          <label class="field">
            <span class="field-label">画面描述</span>
            <textarea
              v-model="prompt"
              rows="5"
              maxlength="1000"
              placeholder="例如：星夜下的少女站在天台，长发被风吹起，远处城市灯光，赛璐璐风格，柔焦，细节精致"
              :disabled="generating"
            />
          </label>

          <label class="field field--compact">
            <span class="field-label">反向提示 <em>可选</em></span>
            <textarea
              v-model="negativePrompt"
              rows="2"
              maxlength="400"
              placeholder="低质量、模糊、畸形手指、文字水印"
              :disabled="generating"
            />
          </label>

          <div class="section-divider" />

          <div class="panel-head">
            <div>
              <span class="section-kicker">Model</span>
              <h2>选择模型</h2>
            </div>
          </div>

          <label class="field">
            <span class="field-label">模型</span>
            <select v-model="model" class="field-select" :disabled="generating">
              <option v-for="option in IMAGE_MODELS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="section-divider" />

          <div class="panel-head">
            <div>
              <span class="section-kicker">Frame</span>
              <h2>比例与画质</h2>
            </div>
          </div>

          <div class="ratio-grid">
            <button
              v-for="option in IMAGE_ASPECT_RATIOS"
              :key="option.value"
              type="button"
              class="ratio-chip"
              :class="{ active: aspectRatio === option.value }"
              :disabled="generating"
              @click="aspectRatio = option.value"
            >
              <span class="ratio-frame" :data-ratio="option.value" />
              <span>{{ option.label }}</span>
            </button>
          </div>

          <div class="quality-row">
            <button
              v-for="option in IMAGE_QUALITY_OPTIONS"
              :key="option.value"
              type="button"
              class="quality-chip"
              :class="{ active: quality === option.value }"
              :disabled="generating"
              @click="quality = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="verify-block">
            <TurnstileWidget
              @verified="onTurnstileVerified"
              @expired="onTurnstileExpired"
              @error="onTurnstileExpired"
            />
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>

          <button class="btn generate-btn" type="submit" :disabled="generating || !prompt.trim()">
            <span v-if="generating" class="btn-shimmer" aria-hidden="true" />
            {{ generating ? "正在绘制画面…" : "开始生成" }}
          </button>
        </form>

        <section class="stage-panel panel" :class="{ loading: generating, ready: !!result?.url }">
          <div class="stage-head">
            <div>
              <span class="section-kicker">Preview</span>
              <h2>预览舞台</h2>
            </div>
            <button
              v-if="result?.url"
              class="btn btn-ghost btn-sm"
              type="button"
              @click="downloadResult"
            >
              保存图片
            </button>
          </div>

          <div class="stage-frame">
            <div class="stage-glow" aria-hidden="true" />

            <div v-if="generating" class="stage-state loading-state">
              <div class="paint-ring">
                <span /><span /><span />
              </div>
              <p>星夜调色盘正在运转</p>
              <small>模型 {{ selectedModel?.label }} · {{ aspectRatio }} · {{ quality }}</small>
            </div>

            <div v-else-if="result?.url" class="stage-state result-state">
              <img :src="result.url" :alt="result.prompt" />
              <div class="result-overlay">
                <div class="result-badges">
                  <span v-if="result.model">{{ result.model }}</span>
                  <span v-if="result.aspectRatio">{{ result.aspectRatio }}</span>
                  <span v-if="result.quality">{{ result.quality }}</span>
                </div>
              </div>
            </div>

            <div v-else class="stage-state idle-state">
              <div class="idle-scene" aria-hidden="true">
                <span class="idle-moon" />
                <span class="idle-star" />
                <span class="idle-star" />
                <span class="idle-star" />
                <span class="idle-star" />
                <span class="idle-hill" />
              </div>
              <p>你的下一张插画会出现在这里</p>
              <small>左侧填好描述后点击生成</small>
            </div>
          </div>

          <p v-if="result?.prompt" class="result-caption">{{ result.prompt }}</p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.generate-page {
  position: relative;
  overflow: hidden;
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.ambient-orb--violet {
  top: -8%;
  right: -4%;
  width: min(520px, 60vw);
  height: min(520px, 60vw);
  background: radial-gradient(circle, rgba(168, 120, 255, 0.55), transparent 68%);
}

.ambient-orb--amber {
  bottom: 8%;
  left: -6%;
  width: min(420px, 50vw);
  height: min(420px, 50vw);
  background: radial-gradient(circle, rgba(240, 179, 91, 0.35), transparent 70%);
}

.page-hero {
  align-items: end;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
}

.metric-card span {
  color: var(--text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.metric-card strong {
  color: var(--text);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 900;
  line-height: 1;
}

.metric-card small {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 460px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.control-panel,
.stage-panel {
  padding: 22px;
}

.stage-panel {
  position: sticky;
  top: 96px;
}

.panel-head,
.stage-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head h2,
.stage-head h2 {
  margin-top: 8px;
  color: var(--text);
  font-size: 1.35rem;
  font-weight: 850;
}

.char-count {
  color: var(--text-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.char-count.warn {
  color: var(--accent-3);
}

.section-divider {
  height: 1px;
  margin: 20px 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.field-label {
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 800;
}

.field-label em {
  color: var(--text-soft);
  font-style: normal;
  font-weight: 700;
}

.field textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025)),
    rgba(8, 10, 15, 0.42);
  color: var(--text);
  line-height: 1.55;
  resize: vertical;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.field textarea:focus {
  outline: none;
  border-color: rgba(240, 179, 91, 0.42);
  box-shadow: 0 0 0 3px rgba(240, 179, 91, 0.12);
}

.field textarea::placeholder {
  color: rgba(125, 135, 149, 0.85);
}

.field-select {
  width: 100%;
  min-height: 48px;
  padding: 12px 40px 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  background-color: #0f141d;
  color: var(--text);
  color-scheme: dark;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23b9b0a2' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 16px) 50%;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.field-select:focus {
  outline: none;
  border-color: rgba(240, 179, 91, 0.42);
  box-shadow: 0 0 0 3px rgba(240, 179, 91, 0.12);
}

.field-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field-select option {
  background: #12182a;
  color: #f7f2e8;
}

.metric-model {
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  line-height: 1.2;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.ratio-chip {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 10px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  transition: border-color var(--transition), background var(--transition), color var(--transition), transform var(--transition);
}

.ratio-chip:hover:not(:disabled),
.ratio-chip.active {
  border-color: rgba(83, 198, 176, 0.45);
  background: rgba(83, 198, 176, 0.1);
  color: var(--text);
}

.ratio-chip.active {
  transform: translateY(-1px);
}

.ratio-frame {
  display: block;
  width: 28px;
  border: 2px solid currentColor;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
}

.ratio-frame[data-ratio="9:16"] { aspect-ratio: 9 / 16; height: 36px; width: auto; }
.ratio-frame[data-ratio="3:4"] { aspect-ratio: 3 / 4; height: 32px; width: auto; }
.ratio-frame[data-ratio="1:1"] { aspect-ratio: 1 / 1; width: 30px; }
.ratio-frame[data-ratio="16:9"] { aspect-ratio: 16 / 9; width: 36px; height: auto; }
.ratio-frame[data-ratio="4:3"] { aspect-ratio: 4 / 3; width: 34px; height: auto; }

.quality-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.quality-chip {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  transition: border-color var(--transition), background var(--transition), color var(--transition);
}

.quality-chip.active {
  border-color: rgba(240, 179, 91, 0.45);
  background: rgba(240, 179, 91, 0.12);
  color: var(--text);
}

.verify-block {
  margin-top: 18px;
}

.form-error {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(239, 111, 108, 0.35);
  border-radius: var(--radius-sm);
  background: rgba(239, 111, 108, 0.08);
  color: var(--text-soft);
  font-size: 0.86rem;
}

.generate-btn {
  position: relative;
  width: 100%;
  min-height: 52px;
  margin-top: 16px;
  overflow: hidden;
  font-size: 0.96rem;
}

.btn-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.28) 45%, transparent 70%);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  from { transform: translateX(-120%); }
  to { transform: translateX(120%); }
}

.stage-panel.loading .stage-frame {
  border-color: rgba(168, 120, 255, 0.35);
}

.stage-panel.ready .stage-frame {
  border-color: rgba(240, 179, 91, 0.35);
}

.stage-frame {
  position: relative;
  min-height: min(68vh, 640px);
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 50% 12%, rgba(168, 120, 255, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015)),
    rgba(8, 10, 15, 0.55);
  transition: border-color 400ms ease, box-shadow 400ms ease;
}

.stage-glow {
  position: absolute;
  inset: auto 12% 8%;
  height: 40%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 160, 255, 0.18), transparent 70%);
  filter: blur(24px);
  pointer-events: none;
}

.stage-state {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: grid;
  place-items: center;
  padding: 28px;
  text-align: center;
}

.loading-state {
  gap: 14px;
}

.paint-ring {
  position: relative;
  width: 72px;
  height: 72px;
}

.paint-ring span {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-right-color: rgba(168, 120, 255, 0.8);
  border-radius: 50%;
  animation: spin 1.1s linear infinite;
}

.paint-ring span:nth-child(2) {
  inset: 10px;
  border-top-color: rgba(83, 198, 176, 0.9);
  border-right-color: transparent;
  animation-duration: 0.85s;
  animation-direction: reverse;
}

.paint-ring span:nth-child(3) {
  inset: 20px;
  border-top-color: rgba(239, 111, 108, 0.85);
  animation-duration: 1.35s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--text);
  font-size: 1rem;
  font-weight: 850;
}

.loading-state small,
.idle-state small {
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 800;
}

.idle-state {
  gap: 12px;
}

.idle-scene {
  position: relative;
  width: 180px;
  height: 140px;
}

.idle-moon {
  position: absolute;
  top: 8px;
  right: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff6d8, #c9a0ff 58%, transparent 60%);
  box-shadow: 0 0 36px rgba(201, 160, 255, 0.45);
  animation: float 4s ease-in-out infinite alternate;
}

.idle-star {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.85);
  animation: twinkle 2.4s ease-in-out infinite alternate;
}

.idle-star:nth-child(2) { top: 18px; left: 24px; animation-delay: 0.2s; }
.idle-star:nth-child(3) { top: 42px; left: 72px; animation-delay: 0.6s; }
.idle-star:nth-child(4) { top: 28px; left: 118px; animation-delay: 1s; }
.idle-star:nth-child(5) { top: 64px; right: 18px; animation-delay: 0.4s; }

.idle-hill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
}

@keyframes float {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

@keyframes twinkle {
  from { opacity: 0.45; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1.1); }
}

.idle-state p {
  color: var(--text-muted);
  font-weight: 850;
}

.result-state {
  padding: 16px;
}

.result-state img {
  width: 100%;
  max-height: min(62vh, 580px);
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  animation: reveal 500ms ease;
}

@keyframes reveal {
  from { opacity: 0; transform: scale(0.98) translateY(8px); }
  to { opacity: 1; transform: none; }
}

.result-overlay {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
}

.result-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.result-badges span {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(8, 10, 15, 0.72);
  backdrop-filter: blur(10px);
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result-caption {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-soft);
  font-size: 0.86rem;
  line-height: 1.6;
}

.btn-sm {
  min-height: 38px;
  padding: 0 14px;
  font-size: 0.82rem;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .stage-panel {
    position: static;
  }

  .stage-frame {
    min-height: 420px;
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .ratio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-metrics {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
