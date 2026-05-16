<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import displayImage from "../assets/001.png";
import imageService, { type GalleryImage } from "../services/imageService";

gsap.registerPlugin(ScrollTrigger);

interface GalleryItem {
  id: string | number;
  src: string;
  title: string;
  alt: string;
  tone: string;
  remote?: GalleryImage;
}

const pageRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);
const remoteImages = ref<GalleryImage[]>([]);
const adminToken = ref(imageService.getAdminToken() || "");
const adminOpen = ref(false);
const uploading = ref(false);
const uploadFile = ref<File | null>(null);
const uploadForm = ref({ title: "", alt: "", tone: "Cloudflare R2" });
let gsapContext: gsap.Context | null = null;

const fallbackImages: GalleryItem[] = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  return {
    id: number,
    src: displayImage,
    title: `Image ${String(number).padStart(2, "0")}`,
    alt: `Image ${String(number).padStart(2, "0")}`,
    tone: ["Warm", "Soft", "Bright", "Clean", "Focus"][index % 5],
  };
});

const images = computed<GalleryItem[]>(() => remoteImages.value.length
  ? remoteImages.value.map((image) => ({
      id: image.id,
      src: image.url,
      title: image.title,
      alt: image.alt,
      tone: image.tone,
      remote: image,
    }))
  : fallbackImages,
);

const animateCards = async () => {
  const page = pageRef.value;
  if (!page) return;
  gsapContext?.revert();
  await nextTick();

  gsapContext = gsap.context(() => {
    gsap.from(".image-hero > *", {
      opacity: 0,
      y: 24,
      duration: 0.72,
      stagger: 0.08,
      ease: "power2.out",
    });

    gsap.utils.toArray<HTMLElement>(".image-card").forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 34,
        scale: 0.96,
        duration: 0.62,
        delay: (index % 6) * 0.035,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
        },
      });
    });
  }, page);
};

const loadImages = async () => {
  loading.value = true;
  error.value = null;
  const result = await imageService.getImages();
  if (result.success && result.data) remoteImages.value = result.data.images;
  else error.value = result.error || "R2 图库暂时不可用，正在显示本地展示位。";
  loading.value = false;
  await animateCards();
};

const saveToken = () => {
  if (!adminToken.value.trim()) return;
  imageService.setAdminToken(adminToken.value.trim());
  notice.value = "图片管理已解锁";
};

const selectFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  uploadFile.value = target.files?.[0] || null;
  if (uploadFile.value && !uploadForm.value.title) {
    uploadForm.value.title = uploadFile.value.name.replace(/\.[^.]+$/, "");
    uploadForm.value.alt = uploadForm.value.title;
  }
};

const uploadImage = async () => {
  if (!uploadFile.value) return;
  saveToken();
  uploading.value = true;
  error.value = null;
  const result = await imageService.uploadImage(uploadFile.value, uploadForm.value);
  if (result.success) {
    notice.value = "图片已上传到 R2";
    uploadFile.value = null;
    uploadForm.value = { title: "", alt: "", tone: "Cloudflare R2" };
    adminOpen.value = false;
    await loadImages();
  } else {
    error.value = result.error || "图片上传失败";
  }
  uploading.value = false;
};

const deleteImage = async (image: GalleryImage) => {
  if (!confirm(`确定删除图片 ${image.title}？`)) return;
  const result = await imageService.deleteImage(image.id);
  if (result.success) {
    notice.value = "图片已删除";
    await loadImages();
  } else {
    error.value = result.error || "图片删除失败";
  }
};

onMounted(loadImages);

onUnmounted(() => {
  gsapContext?.revert();
});
</script>

<template>
  <main ref="pageRef" class="image-page">
    <section class="container image-hero">
      <div>
        <span class="page-tag">Gallery</span>
        <h1 class="page-title">图片展示</h1>
        <p class="page-sub">使用 Cloudflare R2 承载图片，保留 GSAP 入场和滚动动效。</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-ghost" :disabled="loading" @click="loadImages">{{ loading ? "同步中" : "同步 R2" }}</button>
        <button class="btn" @click="adminOpen = true">上传图片</button>
      </div>
    </section>

    <section class="container image-grid-section">
      <p v-if="notice" class="soft-alert success">{{ notice }} <button @click="notice = null">关闭</button></p>
      <p v-if="error" class="soft-alert">{{ error }} <button @click="error = null">关闭</button></p>
      <div class="image-grid">
        <article
          v-for="(image, index) in images"
          :key="image.id"
          class="image-card"
          :class="{ wide: index % 11 === 0, tall: index % 7 === 6 }"
        >
          <img :src="image.src" :alt="image.alt" loading="lazy" />
          <div class="image-meta">
            <strong>{{ image.title }}</strong>
            <span>{{ image.tone }}</span>
          </div>
          <button v-if="image.remote && imageService.getAdminToken()" class="delete-image" @click="deleteImage(image.remote)">删除</button>
        </article>
      </div>
    </section>

    <div v-if="adminOpen" class="modal-overlay" @click="adminOpen = false">
      <form class="upload-modal panel" @click.stop @submit.prevent="uploadImage">
        <header>
          <div>
            <span class="section-kicker">Cloudflare R2</span>
            <h2>上传图片</h2>
          </div>
          <button type="button" @click="adminOpen = false">关闭</button>
        </header>
        <label>管理员密码<input v-model="adminToken" type="password" placeholder="ADMIN_PASSWORD" /></label>
        <label>图片文件<input type="file" accept="image/*" required @change="selectFile" /></label>
        <label>标题<input v-model="uploadForm.title" placeholder="图片标题" /></label>
        <label>替代文本<input v-model="uploadForm.alt" placeholder="用于无障碍和加载失败时展示" /></label>
        <label>标签<input v-model="uploadForm.tone" placeholder="Cloudflare R2" /></label>
        <footer>
          <button type="button" class="btn btn-ghost" @click="adminOpen = false">取消</button>
          <button class="btn" :disabled="uploading || !uploadFile || !adminToken.trim()">{{ uploading ? "上传中" : "上传到 R2" }}</button>
        </footer>
      </form>
    </div>
  </main>
</template>

<style scoped>
.image-page {
  min-height: 100vh;
  padding: 112px 0 72px;
}

.image-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.image-hero .page-title {
  margin-top: 0;
}

.hero-actions,
.upload-modal header,
.upload-modal footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.image-grid-section {
  margin-top: 18px;
}

.soft-alert {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(239, 111, 108, 0.35);
  border-radius: var(--radius-sm);
  background: rgba(239, 111, 108, 0.08);
  color: var(--text-soft);
}

.soft-alert.success {
  border-color: rgba(83, 198, 176, 0.35);
  background: rgba(83, 198, 176, 0.08);
}

.soft-alert button {
  margin-left: 10px;
  color: var(--accent);
  font-weight: 800;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 14px;
}

.image-card {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
}

.image-card.wide {
  grid-column: span 2;
}

.image-card.tall {
  grid-row: span 2;
  min-height: 454px;
}

.image-card img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  filter: saturate(1.06) contrast(1.02);
  transition: transform 600ms ease, filter 600ms ease;
}

.image-card:hover img {
  transform: scale(1.05);
  filter: saturate(1.14) contrast(1.05);
}

.image-meta {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(8, 10, 15, 0.7);
  backdrop-filter: blur(12px);
}

.image-meta strong {
  overflow: hidden;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.delete-image {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(239, 111, 108, 0.82);
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 800;
  opacity: 0;
  transition: opacity var(--transition);
}

.image-card:hover .delete-image {
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(12px);
}

.upload-modal {
  width: min(560px, 100%);
  display: grid;
  gap: 16px;
  padding: 24px;
}

.upload-modal h2 {
  color: var(--text);
  font-size: 1.5rem;
}

.upload-modal label {
  display: grid;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 800;
}

@media (max-width: 1120px) {
  .image-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .image-hero {
    align-items: start;
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .image-page {
    padding-top: 96px;
  }

  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .image-card,
  .image-card.tall {
    min-height: 210px;
  }

  .image-card.wide {
    grid-column: span 2;
  }

  .image-card.tall {
    grid-row: span 1;
  }
}
</style>
