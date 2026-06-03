<script setup lang="ts">
import { ref } from "vue";
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
const style = ref("anime");
const generating = ref(false);
const error = ref<string | null>(null);
const result = ref<GeneratedImage | null>(null);
const turnstileToken = ref("");

const styleOptions = [
  { value: "anime", label: "二次元" },
  { value: "illustration", label: "插画" },
  { value: "pixel", label: "像素" },
  { value: "watercolor", label: "水彩" },
];

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
    style: style.value,
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
    <div class="container">
      <header class="page-hero">
        <div>
          <span class="page-tag">Generate</span>
          <h1 class="page-title">AI 生图</h1>
          <p class="page-sub">输入画面描述，调用 ProRiseHub 音视频模型分组生成插画。每次生成约需 10–60 秒。</p>
        </div>
      </header>

      <div class="generate-layout">
        <form class="generate-form panel" @submit.prevent="generate">
          <span class="section-kicker">Prompt</span>
          <label>
            画面描述
            <textarea
              v-model="prompt"
              rows="4"
              placeholder="例如：星夜下的少女，长发飘动，柔光，赛璐璐风格，细节精致"
              :disabled="generating"
            />
          </label>

          <label>
            反向提示（可选）
            <textarea
              v-model="negativePrompt"
              rows="2"
              placeholder="例如：低质量、模糊、多余手指"
              :disabled="generating"
            />
          </label>

          <label>
            模型
            <select v-model="model" :disabled="generating">
              <option v-for="option in IMAGE_MODELS" :key="option.value" :value="option.value">
                {{ option.label }} · {{ option.price }}
              </option>
            </select>
          </label>

          <div class="field-row">
            <label>
              比例
              <select v-model="aspectRatio" :disabled="generating">
                <option v-for="option in IMAGE_ASPECT_RATIOS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label>
              画质
              <select v-model="quality" :disabled="generating">
                <option v-for="option in IMAGE_QUALITY_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <fieldset class="style-fieldset">
            <legend>风格</legend>
            <div class="style-options">
              <label v-for="option in styleOptions" :key="option.value" class="style-chip">
                <input v-model="style" type="radio" :value="option.value" :disabled="generating" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </fieldset>

          <TurnstileWidget @verified="onTurnstileVerified" @expired="onTurnstileExpired" @error="onTurnstileExpired" />

          <p v-if="error" class="form-error">{{ error }}</p>

          <button class="btn generate-btn" type="submit" :disabled="generating || !prompt.trim()">
            {{ generating ? "生成中…" : "开始生成" }}
          </button>
        </form>

        <section class="result-panel panel">
          <div class="result-head">
            <span class="section-kicker">Preview</span>
            <button
              v-if="result?.url"
              class="btn btn-ghost btn-sm"
              type="button"
              @click="downloadResult"
            >
              保存图片
            </button>
          </div>

          <div v-if="generating" class="result-placeholder">
            <div class="spinner"></div>
            <p>正在绘制画面，请稍候…</p>
          </div>

          <div v-else-if="result?.url" class="result-image-wrap">
            <img :src="result.url" :alt="result.prompt" />
            <p class="result-caption">{{ result.prompt }}</p>
            <p v-if="result.model" class="result-meta">
              {{ result.model }} · {{ result.aspectRatio }} · {{ result.quality }}
            </p>
          </div>

          <div v-else class="result-placeholder idle">
            <div class="idle-art" aria-hidden="true">
              <span class="idle-star" />
              <span class="idle-star" />
              <span class="idle-star" />
              <span class="idle-moon" />
            </div>
            <p>生成结果会显示在这里</p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.generate-page {
  min-height: 100vh;
}

.page-hero {
  margin-bottom: 24px;
}

.generate-layout {
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.generate-form,
.result-panel {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.generate-form label {
  display: grid;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 800;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.generate-form textarea,
.generate-form select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
}

.generate-form textarea {
  min-height: 96px;
  resize: vertical;
}

.generate-form select {
  min-height: 44px;
}

.style-fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.style-fieldset legend {
  margin-bottom: 10px;
  color: var(--text-muted);
  font-size:  0.86rem;
  font-weight: 800;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-chip {
  cursor: pointer;
}

.style-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.style-chip span {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  transition: border-color var(--transition), background var(--transition), color var(--transition);
}

.style-chip input:checked + span,
.style-chip:hover span {
  border-color: rgba(240, 179, 91, 0.45);
  background: rgba(240, 179, 91, 0.12);
  color: var(--text);
}

.form-error {
  padding: 10px 12px;
  border: 1px solid rgba(239, 111, 108, 0.35);
  border-radius: var(--radius-sm);
  background: rgba(239, 111, 108, 0.08);
  color: var(--text-soft);
  font-size: 0.86rem;
}

.generate-btn {
  width: 100%;
  min-height: 48px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.btn-sm {
  min-height: 36px;
  padding: 0 14px;
  font-size: 0.82rem;
}

.result-placeholder {
  min-height: 420px;
  display: grid;
  place-items: center;
  gap: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-sm);
  background:
    radial-gradient(circle at 50% 20%, rgba(168, 120, 255, 0.16), transparent 42%),
    rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-weight: 800;
  text-align: center;
}

.result-placeholder.idle {
  position: relative;
  overflow: hidden;
}

.idle-art {
  position: relative;
  width: 120px;
  height: 120px;
}

.idle-star {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.idle-star:nth-child(1) {
  top: 18px;
  left: 24px;
}

.idle-star:nth-child(2) {
  top: 42px;
  right: 20px;
}

.idle-star:nth-child(3) {
  bottom: 36px;
  left: 48px;
}

.idle-moon {
  position: absolute;
  inset: 24px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff6d8, #c9a0ff 58%, transparent 60%);
  box-shadow: 0 0 40px rgba(201, 160, 255, 0.45);
}

.result-image-wrap {
  display: grid;
  gap: 12px;
}

.result-image-wrap img {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.12);
  object-fit: contain;
  background: rgba(0, 0, 0, 0.2);
}

.result-caption {
  color: var(--text-soft);
  font-size: 0.84rem;
}

.result-meta {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .generate-layout {
    grid-template-columns: 1fr;
  }

  .result-placeholder {
    min-height: 320px;
  }
}

@media (max-width: 520px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
