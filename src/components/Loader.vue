<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

const isLoading = ref(true);

onMounted(() => {
  const tl = gsap.timeline({
    onComplete: () => {
      // 动画完成后隐藏加载器
      setTimeout(() => {
        isLoading.value = false;
        // 触发页面内容动画
        document.dispatchEvent(new Event("loader-complete"));
      }, 200);
    },
  });

  // Logo入场动画
  tl.from(".loader-logo", {
    opacity: 0,
    scale: 0.3,
    rotation: -180,
    duration: 1,
    ease: "back.out(1.7)",
  })

    // 稍作停留
    .to({}, { duration: 0.8 })

    // Logo淡出
    .to(".loader-logo", {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in",
    })

    // 斜向分割开屏动画 - 优化版本
    .to(
      ".split-left",
      {
        x: "-110%", // 增加移动距离确保完全移出
        skewX: -12, // 减少倾斜角度
        duration: 1,
        ease: "power2.inOut", // 使用更平滑的缓动
      },
      "-=0.2"
    )
    .to(
      ".split-right",
      {
        x: "110%", // 增加移动距离确保完全移出
        skewX: 12, // 减少倾斜角度
        duration: 1,
        ease: "power2.inOut", // 使用更平滑的缓动
      },
      "<"
    ); // 同时执行
});
</script>

<template>
  <div v-if="isLoading" class="loader">
    <!-- 左侧分割 -->
    <div class="split-left"></div>
    <!-- 右侧分割 -->
    <div class="split-right"></div>

    <!-- 中心Logo -->
    <div class="loader-content">
      <div class="loader-logo">
        <span class="logo-text">空空</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 左侧分割 */
.split-left {
  position: absolute;
  top: -5%; /* 向上扩展避免边界问题 */
  left: -5%; /* 向左扩展避免边界问题 */
  width: 55%; /* 增加宽度确保覆盖 */
  height: 110%; /* 增加高度确保覆盖 */
  background: linear-gradient(135deg, #1a1d23 0%, #2c3e50 100%);
  transform-origin: right center;
  z-index: 2;
  /* 性能优化 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0); /* 启用硬件加速 */
}

/* 右侧分割 */
.split-right {
  position: absolute;
  top: -5%; /* 向上扩展避免边界问题 */
  right: -5%; /* 向右扩展避免边界问题 */
  width: 55%; /* 增加宽度确保覆盖 */
  height: 110%; /* 增加高度确保覆盖 */
  background: linear-gradient(135deg, #2c3e50 0%, #1a1d23 100%);
  transform-origin: left center;
  z-index: 2;
  /* 性能优化 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0); /* 启用硬件加速 */
}

/* 中心内容 */
.loader-content {
  position: relative;
  z-index: 3;
  text-align: center;
}

.loader-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 4rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(0, 173, 181, 0.5);
  filter: drop-shadow(0 0 20px rgba(0, 173, 181, 0.3));
  /* 性能优化 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logo-text {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .logo-text {
    font-size: 2.5rem;
  }
}
</style>
