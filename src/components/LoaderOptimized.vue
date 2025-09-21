<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import gsap from "gsap";

// 加载现代化字体
const loadModernFont = () => {
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;700&display=swap";
  link.rel = "stylesheet";
  link.media = "print";
  link.onload = () => {
    link.media = "all";
  };
  document.head.appendChild(link);
};

// 在组件挂载前加载字体
loadModernFont();

const isLoading = ref(true);
const videoLoaded = ref(false);
const showFallback = ref(false);
const loadingProgress = ref(0);

// 检测用户网络状况
const getConnectionSpeed = () => {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    // 如果是慢速网络，直接显示备用动画
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      return 'slow';
    }
  }
  return 'normal';
};

// 检测设备性能
const isLowEndDevice = () => {
  // @ts-ignore
  const memory = navigator.deviceMemory;
  // @ts-ignore
  const cores = navigator.hardwareConcurrency;
  
  // 如果内存小于4GB或CPU核心数少于4，认为是低端设备
  return (memory && memory < 4) || (cores && cores < 4);
};

onMounted(() => {
  const connectionSpeed = getConnectionSpeed();
  const isLowEnd = isLowEndDevice();
  
  // 如果是低端设备或慢速网络，直接显示备用动画
  if (connectionSpeed === 'slow' || isLowEnd) {
    console.log('检测到低端设备或慢速网络，使用备用动画');
    showFallback.value = true;
    startFallbackAnimation();
    return;
  }

  // 设置最大显示时间为3秒（缩短等待时间）
  const maxDisplayTime = setTimeout(() => {
    console.log('3秒时间到，强制关闭开屏');
    closeSplash();
  }, 3000);

  // 设置最小显示时间为1.5秒（缩短最小时间）
  const minDisplayTime = setTimeout(() => {
    console.log('1.5秒最小时间已过');
    if (videoLoaded.value) {
      const video = document.querySelector(".splash-video") as HTMLVideoElement;
      if (video && (video.readyState >= 3 || video.ended)) {
        clearTimeout(maxDisplayTime);
        closeSplash();
      }
    }
  }, 1500);

  // 等待视频加载完成后开始动画
  nextTick(() => {
    const video = document.querySelector(".splash-video") as HTMLVideoElement;
    if (video) {
      // 添加多个事件监听器以更好地处理加载状态
      video.addEventListener("loadeddata", onVideoLoaded);
      video.addEventListener("canplay", onVideoCanPlay);
      video.addEventListener("ended", () => onVideoEnded(maxDisplayTime, minDisplayTime));
      video.addEventListener("error", onVideoError);
      
      // 添加加载进度监听
      video.addEventListener("progress", onVideoProgress);
      
      // 设置视频加载超时（2秒后如果还没加载好就显示备用动画）
      setTimeout(() => {
        if (!videoLoaded.value) {
          console.log('视频加载超时，切换到备用动画');
          video.style.display = 'none';
          showFallback.value = true;
          startFallbackAnimation();
        }
      }, 2000);
    }
  });
});

const onVideoProgress = () => {
  const video = document.querySelector(".splash-video") as HTMLVideoElement;
  if (video && video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const duration = video.duration || 1;
    loadingProgress.value = (bufferedEnd / duration) * 100;
  }
};

const onVideoLoaded = () => {
  console.log('视频数据加载完成');
  videoLoaded.value = true;
  startVideoAnimation();
};

const onVideoCanPlay = () => {
  console.log('视频可以播放');
  videoLoaded.value = true;
};

const onVideoError = () => {
  console.log('视频加载失败，使用备用动画');
  showFallback.value = true;
  startFallbackAnimation();
};

const startVideoAnimation = () => {
  const video = document.querySelector(".splash-video") as HTMLVideoElement;
  const content = document.querySelector(".splash-content") as HTMLElement;

  if (video && content) {
    // 淡入视频
    gsap.fromTo(video, 
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
    );
    
    // 文字动画
    gsap.fromTo(content,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power2.out" }
    );
  }
};

const startFallbackAnimation = () => {
  const content = document.querySelector(".splash-content") as HTMLElement;
  const fallback = document.querySelector(".fallback-animation") as HTMLElement;

  if (content && fallback) {
    // 显示备用动画
    gsap.set(fallback, { display: 'block' });
    
    // 渐变背景动画
    gsap.fromTo(fallback,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 }
    );
    
    // 文字动画
    gsap.fromTo(content,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: "power2.out" }
    );
    
    // 1.5秒后自动关闭
    setTimeout(() => {
      closeSplash();
    }, 1500);
  }
};

const onVideoEnded = (maxDisplayTime: NodeJS.Timeout, minDisplayTime: NodeJS.Timeout) => {
  console.log('视频播放结束');
  clearTimeout(maxDisplayTime);
  clearTimeout(minDisplayTime);
  
  // 短暂延迟后关闭，让用户看到完整的动画
  setTimeout(() => {
    closeSplash();
  }, 500);
};

const closeSplash = () => {
  const splashScreen = document.querySelector(".video-splash-screen") as HTMLElement;

  if (splashScreen) {
    gsap.to(splashScreen, {
      opacity: 0,
      scale: 1.05,
      duration: 0.6,
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
      <!-- 优化后的视频元素 -->
      <video 
        v-if="!showFallback"
        class="splash-video" 
        autoplay 
        muted 
        playsinline 
        preload="metadata"
        :poster="null"
      >
        <source src="@/assets/2.mp4" type="video/mp4" />
      </video>
      
      <!-- 备用渐变动画 -->
      <div v-if="showFallback" class="fallback-animation">
        <div class="gradient-bg"></div>
      </div>
      
      <div class="splash-overlay">
        <div class="splash-content">
          <h1 class="splash-title">JisooLove</h1>
          <p class="splash-subtitle">Personal Website</p>
          
          <!-- 加载进度指示器 -->
          <div v-if="!showFallback && !videoLoaded" class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <p class="loading-text">Loading... {{ Math.round(loadingProgress) }}%</p>
          </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  z-index: 1;
  transform: translate(-50%, -50%) translateZ(0);
  object-fit: cover;
  opacity: 0;
  /* 性能优化 */
  will-change: opacity, transform;
  backface-visibility: hidden;
}

/* 备用渐变动画 */
.fallback-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    #ff6b6b,
    #feca57,
    #48dbfb,
    #ff9ff3,
    #54a0ff
  );
  background-size: 400% 400%;
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.splash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-content {
  text-align: center;
  color: white;
  z-index: 3;
  opacity: 0;
}

.splash-title {
  font-family: "Orbitron", monospace;
  font-size: 4rem;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  letter-spacing: 0.1em;
}

.splash-subtitle {
  font-family: "Exo 2", sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  margin: 1rem 0 0 0;
  opacity: 0.9;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* 加载进度指示器 */
.loading-progress {
  margin-top: 2rem;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-text {
  font-family: "Exo 2", sans-serif;
  font-size: 0.9rem;
  opacity: 0.7;
  margin: 0;
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
  
  .progress-bar {
    width: 150px;
  }
}

/* 低性能设备优化 */
@media (max-width: 768px) and (max-height: 1024px) {
  .splash-video {
    /* 在移动设备上降低视频质量要求 */
    object-fit: cover;
  }
}
</style>