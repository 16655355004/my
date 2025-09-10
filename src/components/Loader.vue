<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import gsap from "gsap";

// 加载现代化字体
const loadModernFont = () => {
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

// 在组件挂载前加载字体
loadModernFont();

const isLoading = ref(true);
const videoLoaded = ref(false);

onMounted(() => {
  // 设置最大显示时间为5秒
  const maxDisplayTime = setTimeout(() => {
    console.log("5秒时间到，强制关闭开屏");
    closeSplash();
  }, 5000);

  // 设置最小显示时间为3秒
  const minDisplayTime = setTimeout(() => {
    console.log("3秒最小时间已过");
    // 如果视频已经结束，可以关闭开屏
    if (videoLoaded.value) {
      const video = document.querySelector(".splash-video") as HTMLVideoElement;
      if (video && video.ended) {
        clearTimeout(maxDisplayTime);
        closeSplash();
      }
    }
  }, 3000);

  // 等待视频加载完成后开始动画
  nextTick(() => {
    const video = document.querySelector(".splash-video") as HTMLVideoElement;
    if (video) {
      video.addEventListener("loadeddata", onVideoLoaded);
      video.addEventListener("ended", () => onVideoEnded(maxDisplayTime, minDisplayTime));
    }
  });
});

const onVideoLoaded = () => {
  console.log("视频加载完成");
  videoLoaded.value = true;

  // 视频加载完成后开始播放动画
  nextTick(() => {
    animateSplashContent();
  });
};

const onVideoEnded = (maxTimer: number, minTimer: number) => {
  console.log("视频播放结束");
  // 清除定时器，视频结束后立即关闭（但要等待最小3秒）
  clearTimeout(maxTimer);
  clearTimeout(minTimer);
  setTimeout(() => {
    closeSplash();
  }, 500);
};

const animateSplashContent = () => {
  const title = document.querySelector(".splash-title") as HTMLElement;
  const subtitle = document.querySelector(".splash-subtitle") as HTMLElement;
  const dots = document.querySelector(".loading-dots") as HTMLElement;

  if (title && subtitle && dots) {
    const tl = gsap.timeline();

    // 标题动画
    tl.fromTo(
      title,
      { opacity: 0, y: 30, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)",
        delay: 0.5,
      }
    )

      // 副标题动画
      .fromTo(
        subtitle,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.5"
      )

      // 加载点动画
      .fromTo(
        dots,
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.3"
      );
  }
};

const closeSplash = () => {
  const splashScreen = document.querySelector(".video-splash-screen") as HTMLElement;

  if (splashScreen) {
    gsap.to(splashScreen, {
      opacity: 0,
      scale: 1.1,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        isLoading.value = false;
        // 触发页面内容动画
        document.dispatchEvent(new Event("loader-complete"));
      },
    });
  } else {
    isLoading.value = false;
    document.dispatchEvent(new Event("loader-complete"));
  }
};
</script>

<template>
  <div v-if="isLoading" class="video-splash-screen">
    <div class="video-container">
      <video class="splash-video" autoplay muted playsinline preload="auto" loop>
        <source src="@/assets/2.mp4" type="video/mp4" />
        <!-- <source
          src="https://img.jisoolove.top/file/BAACAgUAAyEGAASnZpmtAAMdaMEnwVch04FwrehokP-tyCT2E4EAAhEZAALe2whWZ7HAcXFT6ek2BA.mp4"
          type="video/mp4"
        /> -->
        <!-- <source src="https://img.jisoolove.top/file/BAACAgUAAyEGAASnZpmtAAMcaMEkhpiWCPoWboLptX4YnAaFq_wAAg8ZAALe2whWb2_5hn6tt_s2BA.mp4" type="video/mp4" /> -->
      </video>
      <div class="splash-overlay">
        <div class="splash-content">
          <h1 class="splash-title">JisooLove</h1>
          <p class="splash-subtitle">个人网站</p>
          <!-- <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 视频开屏动画样式 */
.video-splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 性能优化 */
  will-change: opacity, transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.splash-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 性能优化 */
  will-change: auto;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 硬件加速 */
  transform: translate3d(0, 0, 0);
  /* 减少重绘 */
  pointer-events: none;
  /* 优化渲染 */
  image-rendering: optimizeSpeed;
  image-rendering: -webkit-optimize-contrast;
}

.splash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-content {
  text-align: center;
  color: white;
  z-index: 10;
  /* 性能优化 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.splash-title {
  font-size: 4rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  font-family: "Parisienne", "Orbitron", "Arial Black", Arial, sans-serif;
  background: linear-gradient(135deg, #fc7979, #d5b1f8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  /* 性能优化 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.splash-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0 0 2rem 0;
  font-family: "Exo 2", "Arial", sans-serif;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.1em;
  /* 性能优化 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  /* 性能优化 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb);
  border-radius: 50%;
  animation: loadingDots 1.5s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingDots {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .splash-title {
    font-size: 3rem;
  }

  .splash-subtitle {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .splash-title {
    font-size: 2.5rem;
  }

  .splash-subtitle {
    font-size: 1rem;
  }
}
</style>
