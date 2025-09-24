<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

interface CardProps {
  title: string
  description: string
  icon: string
  color: string
  delay?: number
}

const props = withDefaults(defineProps<CardProps>(), {
  delay: 0
})

const cardRef = ref<HTMLElement>()
const isHovered = ref(false)

// 鼠标进入事件
const handleMouseEnter = (event: MouseEvent) => {
  isHovered.value = true
  const card = cardRef.value
  if (!card) return

  gsap.to(card, {
    rotationY: 15,
    rotationX: 10,
    scale: 1.05,
    z: 50,
    duration: 0.6,
    ease: "power2.out",
    transformOrigin: "center center"
  })

  // 添加光晕效果
  gsap.to(card.querySelector('.card-glow'), {
    opacity: 0.8,
    scale: 1.1,
    duration: 0.4,
    ease: "power2.out"
  })
}

// 鼠标移动事件 - 3D跟随效果
const handleMouseMove = (event: MouseEvent) => {
  if (!isHovered.value) return
  
  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const deltaX = (event.clientX - centerX) / (rect.width / 2)
  const deltaY = (event.clientY - centerY) / (rect.height / 2)

  gsap.to(card, {
    rotationY: deltaX * 25,
    rotationX: -deltaY * 25,
    duration: 0.3,
    ease: "power2.out"
  })
}

// 鼠标离开事件
const handleMouseLeave = () => {
  isHovered.value = false
  const card = cardRef.value
  if (!card) return

  gsap.to(card, {
    rotationY: 0,
    rotationX: 0,
    scale: 1,
    z: 0,
    duration: 0.6,
    ease: "power2.out"
  })

  gsap.to(card.querySelector('.card-glow'), {
    opacity: 0,
    scale: 1,
    duration: 0.4,
    ease: "power2.out"
  })
}

// 点击动画
const handleClick = () => {
  const card = cardRef.value
  if (!card) return

  gsap.to(card, {
    scale: 0.95,
    duration: 0.1,
    ease: "power2.out",
    yoyo: true,
    repeat: 1
  })

  // 创建点击波纹效果
  const ripple = document.createElement('div')
  ripple.className = 'click-ripple'
  card.appendChild(ripple)

  gsap.fromTo(ripple, 
    { scale: 0, opacity: 0.6 },
    { 
      scale: 2, 
      opacity: 0, 
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    }
  )
}

onMounted(() => {
  const card = cardRef.value
  if (!card) return

  // 入场动画
  gsap.fromTo(card, 
    {
      opacity: 0,
      y: 50,
      rotationX: -90,
      scale: 0.8
    },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      scale: 1,
      duration: 0.8,
      delay: props.delay,
      ease: "back.out(1.7)"
    }
  )

  // 浮动动画
  gsap.to(card, {
    y: -10,
    duration: 3,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: props.delay
  })
})
</script>

<template>
  <div 
    ref="cardRef"
    class="floating-card-3d"
    :style="{ '--card-color': color }"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- 光晕效果 -->
    <div class="card-glow"></div>
    
    <!-- 卡片内容 -->
    <div class="card-content">
      <div class="card-icon">{{ icon }}</div>
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-description">{{ description }}</p>
      
      <!-- 装饰性元素 -->
      <div class="card-decoration">
        <div class="decoration-line"></div>
        <div class="decoration-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- 边框光效 -->
    <div class="card-border-glow"></div>
  </div>
</template>

<style scoped>
.floating-card-3d {
  position: relative;
  width: 100%;
  height: 280px;
  background: var(--card-background);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transform-style: preserve-3d;
  perspective: 1000px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--card-color, #00d4ff) 0%, transparent 70%);
  opacity: 0;
  z-index: -1;
  filter: blur(30px);
}

.card-content {
  position: relative;
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 2;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px var(--card-color, #00d4ff));
}

.card-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.8rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.card-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.card-decoration {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.decoration-line {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--card-color, #00d4ff), transparent);
  border-radius: 1px;
}

.decoration-dots {
  display: flex;
  gap: 0.3rem;
}

.decoration-dots span {
  width: 4px;
  height: 4px;
  background: var(--card-color, #00d4ff);
  border-radius: 50%;
  opacity: 0.6;
  animation: dotPulse 2s ease-in-out infinite;
}

.decoration-dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.decoration-dots span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.card-border-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  background: linear-gradient(45deg, 
    transparent 30%, 
    var(--card-color, #00d4ff) 50%, 
    transparent 70%
  );
  opacity: 0;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.floating-card-3d:hover .card-border-glow {
  opacity: 0.3;
  animation: borderRotate 3s linear infinite;
}

@keyframes borderRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点击波纹效果 */
.click-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, var(--card-color, #00d4ff) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-card-3d {
    height: 240px;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .card-icon {
    font-size: 2.5rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-description {
    font-size: 0.85rem;
  }
}
</style>
