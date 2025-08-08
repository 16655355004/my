<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";

// 加载 Google Fonts
const loadGoogleFont = () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

// 在组件挂载前加载字体
loadGoogleFont();

const isLoading = ref(true);

onMounted(() => {
  const tl = gsap.timeline({
    onComplete: () => {
      // 动画完成后隐藏加载器
      setTimeout(() => {
        isLoading.value = false;
        // 触发页面内容动画
        document.dispatchEvent(new Event("loader-complete"));
      }, 150); // 缩短完成后的延迟时间
    },
  });

  // Netflix 风格动画序列
  tl
    // 1. 背景渐变动画
    .to(".netflix-bg", {
      opacity: 1,
      duration: 0.4, // 缩短动画时间
      ease: "power2.out",
    })

    // 2. Logo 缩放进入
    .fromTo(
      ".netflix-logo",
      {
        scale: 0.3,
        opacity: 0,
        rotationY: -90,
      },
      {
        scale: 1,
        opacity: 1,
        rotationY: 0,
        duration: 0.6, // 缩短动画时间
        ease: "power3.out",
      },
      "-=0.2" // 调整重叠时间
    )

    // 3. 绿蓝渐变发光效果（已移除发光效果）
    .to(
      ".netflix-logo",
      {
        duration: 0.3, // 缩短动画时间
        ease: "power2.out",
      },
      "-=0.2" // 调整重叠时间
    )

    // 4. 脉冲效果
    .to(
      ".netflix-logo",
      {
        scale: 1.05,
        duration: 0.2, // 缩短动画时间
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1,
      },
      "-=0.1" // 调整重叠时间
    )

    // 5. 停留
    .to({}, { duration: 0.3 }) // 缩短停留时间

    // 6. Logo 淡出
    .to(".netflix-logo", {
      opacity: 0,
      scale: 0.9,
      duration: 0.3, // 缩短动画时间
      ease: "power2.in",
    })

    // 7. 背景淡出
    .to(
      ".netflix-bg",
      {
        opacity: 0,
        duration: 0.4, // 缩短动画时间
        ease: "power2.in",
      },
      "-=0.2"
    )

    // 8. 整体淡出
    .to(
      ".netflix-loader",
      {
        opacity: 0,
        duration: 0.2, // 缩短动画时间
        ease: "power2.in",
      },
      "-=0.1" // 调整重叠时间
    );
});
</script>

<template>
  <div v-if="isLoading" class="netflix-loader">
    <!-- Netflix 风格背景 -->
    <div class="netflix-bg"></div>

    <!-- Netflix Logo -->
    <div class="netflix-content">
      <div class="netflix-logo">KONG</div>
    </div>
  </div>
</template>

<style scoped>
/* Netflix 风格加载器 */
.netflix-loader {
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
  /* 性能优化 */
  will-change: opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* 绿蓝渐变背景 */
.netflix-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0a1a2a 0%, #001122 50%, #000000 100%),
    linear-gradient(
      135deg,
      rgba(0, 212, 170, 0.1) 0%,
      rgba(30, 144, 255, 0.1) 50%,
      rgba(0, 188, 212, 0.1) 100%
    );
  opacity: 0;
  /* 性能优化 */
  will-change: opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* 添加绿蓝渐变纹理效果 */
.netflix-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 50%, rgba(0, 212, 170, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(0, 188, 212, 0.18) 0%, transparent 50%),
    radial-gradient(circle at 60% 30%, rgba(0, 255, 127, 0.08) 0%, transparent 40%);
  opacity: 0.8;
  animation: bg-pulse 4s ease-in-out infinite alternate;
}

/* 背景脉冲动画 */
@keyframes bg-pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.02);
  }
}

/* Netflix 内容容器 */
.netflix-content {
  position: relative;
  z-index: 3;
  text-align: center;
  perspective: 1000px;
}

/* KONG Logo 绿蓝渐变样式 */
.netflix-logo {
  font-size: 5rem;
  font-weight: 900;
  font-family: "Orbitron", "Arial Black", Arial, sans-serif;
  font-style: italic;
  letter-spacing: 0.15em;
  text-transform: uppercase;

  /* 炫酷绿蓝渐变 */
  background: linear-gradient(
    135deg,
    #00ff87 0%,
    /* 亮绿色 */ #00d4aa 25%,
    /* 青绿色 */ #1e90ff 50%,
    /* 道奇蓝 */ #00bcd4 75%,
    /* 青蓝色 */ #0099cc 100% /* 深蓝色 */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* 动态背景大小 */
  background-size: 200% 200%;
  animation: gradient-shift 3s ease-in-out infinite;

  /* 性能优化 */
  will-change: transform, opacity, background-position;
  backface-visibility: hidden;
  transform: translateZ(0);

  /* 3D 效果 */
  transform-style: preserve-3d;
}

/* 渐变动画 */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 绿蓝渐变发光效果 */
.netflix-logo::before {
  content: "KONG";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 255, 135, 0.2) 0%,
    /* 柔和亮绿色发光 */ rgba(0, 212, 170, 0.2) 25%,
    /* 柔和青绿色发光 */ rgba(30, 144, 255, 0.3) 50%,
    /* 柔和蓝色发光 */ rgba(0, 188, 212, 0.2) 75%,
    /* 柔和青蓝色发光 */ rgba(0, 153, 204, 0.3) 100% /* 柔和深蓝色发光 */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  filter: blur(20px);
  opacity: 0;
  z-index: -1;
  animation: glow-pulse 2.5s ease-in-out infinite alternate, gradient-shift 4s ease-in-out infinite;
}

/* 绿蓝发光脉冲动画 */
@keyframes glow-pulse {
  0% {
    opacity: 0.4;
    transform: scale(1);
    filter: blur(8px);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.08);
    filter: blur(12px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .netflix-logo {
    font-size: 4rem;
    letter-spacing: 0.08em;
  }
}

@media (max-width: 480px) {
  .netflix-logo {
    font-size: 3rem;
    letter-spacing: 0.05em;
  }
}

/* 绿蓝渐变旋转环效果 */
.netflix-loader::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 250px;
  height: 250px;
  margin: -125px 0 0 -125px;
  border: 3px solid transparent;
  border-top: 3px solid rgba(0, 255, 135, 0.4);
  border-right: 3px solid rgba(30, 144, 255, 0.3);
  border-radius: 50%;
  animation: green-blue-spin 4s linear infinite;
  opacity: 0.6;
}

/* 绿蓝渐变旋转动画 */
@keyframes green-blue-spin {
  0% {
    transform: rotate(0deg);
    border-top-color: rgba(0, 255, 135, 0.4);
    border-right-color: rgba(30, 144, 255, 0.2);
  }
  25% {
    border-top-color: rgba(0, 212, 170, 0.6);
    border-right-color: rgba(0, 188, 212, 0.4);
  }
  50% {
    border-top-color: rgba(30, 144, 255, 0.8);
    border-right-color: rgba(0, 255, 135, 0.6);
  }
  75% {
    border-top-color: rgba(0, 188, 212, 0.6);
    border-right-color: rgba(0, 212, 170, 0.4);
  }
  100% {
    transform: rotate(360deg);
    border-top-color: rgba(0, 255, 135, 0.4);
    border-right-color: rgba(30, 144, 255, 0.2);
  }
}
</style>
