<script setup lang="ts">
import { useTheme } from '../composables/useTheme'
import gsap from 'gsap'
import { ref, onMounted } from 'vue'

const { toggleTheme, isDark, themeIcon, themeLabel } = useTheme()
const buttonRef = ref<HTMLElement>()

const handleToggle = () => {
  // 添加点击动画
  if (buttonRef.value) {
    gsap.to(buttonRef.value, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    })
    
    // 图标旋转动画
    gsap.to(buttonRef.value.querySelector('.theme-icon'), {
      rotation: 360,
      duration: 0.5,
      ease: "back.out(1.7)"
    })
  }
  
  toggleTheme()
}

onMounted(() => {
  // 初始动画
  if (buttonRef.value) {
    gsap.from(buttonRef.value, {
      scale: 0,
      rotation: 180,
      duration: 0.6,
      delay: 3.2,
      ease: "back.out(1.7)"
    })
  }
})
</script>

<template>
  <button
    ref="buttonRef"
    @click="handleToggle"
    class="theme-toggle"
    :title="themeLabel"
    :aria-label="themeLabel"
  >
    <span class="theme-icon">{{ themeIcon }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  background: var(--primary-color);
  backdrop-filter: blur(10px);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
}

.theme-toggle:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(255, 51, 102, 0.4);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

/* 主题切换动画 - 仅针对必要元素 */
:global(body.theme-transitioning) {
  transition: background-color 0.25s ease-out, color 0.25s ease-out;
}

/* 只对特定元素应用过渡，避免全局影响 */
:global(body.theme-transitioning .theme-sensitive) {
  transition: background-color 0.25s ease-out, color 0.25s ease-out, border-color 0.25s ease-out;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-toggle {
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .theme-toggle:hover {
    transform: scale(1.1);
  }
  
  .theme-toggle:active {
    transform: scale(0.95);
  }
}
</style>
