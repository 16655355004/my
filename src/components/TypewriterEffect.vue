<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface TypewriterProps {
  texts: string[]
  speed?: number
  deleteSpeed?: number
  pauseDuration?: number
  loop?: boolean
  showCursor?: boolean
  cursorChar?: string
  startDelay?: number
}

const props = withDefaults(defineProps<TypewriterProps>(), {
  speed: 100,
  deleteSpeed: 50,
  pauseDuration: 2000,
  loop: true,
  showCursor: true,
  cursorChar: '|',
  startDelay: 0
})

const displayText = ref('')
const currentIndex = ref(0)
const isDeleting = ref(false)
const isPaused = ref(false)
const showCursor = ref(true)
const timeoutId = ref<number>()
const cursorBlinkId = ref<number>()

// 光标闪烁效果
const startCursorBlink = () => {
  if (!props.showCursor) return
  
  cursorBlinkId.value = window.setInterval(() => {
    showCursor.value = !showCursor.value
  }, 530)
}

const stopCursorBlink = () => {
  if (cursorBlinkId.value) {
    clearInterval(cursorBlinkId.value)
    showCursor.value = true
  }
}

// 打字机核心逻辑
const typeWriter = () => {
  if (props.texts.length === 0) return

  const currentText = props.texts[currentIndex.value]
  
  if (!isDeleting.value) {
    // 正在输入
    if (displayText.value.length < currentText.length) {
      displayText.value = currentText.substring(0, displayText.value.length + 1)
      timeoutId.value = window.setTimeout(typeWriter, props.speed)
    } else {
      // 输入完成，暂停
      isPaused.value = true
      timeoutId.value = window.setTimeout(() => {
        isPaused.value = false
        if (props.loop || currentIndex.value < props.texts.length - 1) {
          isDeleting.value = true
          typeWriter()
        }
      }, props.pauseDuration)
    }
  } else {
    // 正在删除
    if (displayText.value.length > 0) {
      displayText.value = currentText.substring(0, displayText.value.length - 1)
      timeoutId.value = window.setTimeout(typeWriter, props.deleteSpeed)
    } else {
      // 删除完成，切换到下一个文本
      isDeleting.value = false
      currentIndex.value = (currentIndex.value + 1) % props.texts.length
      
      // 如果不循环且已到最后一个，停止
      if (!props.loop && currentIndex.value === 0) {
        currentIndex.value = props.texts.length - 1
        displayText.value = props.texts[currentIndex.value]
        return
      }
      
      timeoutId.value = window.setTimeout(typeWriter, props.speed)
    }
  }
}

// 开始打字机效果
const startTypewriter = () => {
  timeoutId.value = window.setTimeout(() => {
    typeWriter()
    startCursorBlink()
  }, props.startDelay)
}

// 停止打字机效果
const stopTypewriter = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
  }
  stopCursorBlink()
}

// 重置打字机
const resetTypewriter = () => {
  stopTypewriter()
  displayText.value = ''
  currentIndex.value = 0
  isDeleting.value = false
  isPaused.value = false
  showCursor.value = true
}

// 手动设置文本（用于外部控制）
const setText = (text: string) => {
  stopTypewriter()
  displayText.value = text
  showCursor.value = true
  startCursorBlink()
}

// 暴露方法给父组件
defineExpose({
  start: startTypewriter,
  stop: stopTypewriter,
  reset: resetTypewriter,
  setText
})

onMounted(() => {
  if (props.texts.length > 0) {
    startTypewriter()
  }
})

onUnmounted(() => {
  stopTypewriter()
})
</script>

<template>
  <span class="typewriter-container">
    <span class="typewriter-text">{{ displayText }}</span>
    <span 
      v-if="props.showCursor" 
      class="typewriter-cursor"
      :class="{ 'cursor-blink': showCursor }"
    >
      {{ props.cursorChar }}
    </span>
  </span>
</template>

<style scoped>
.typewriter-container {
  display: inline-block;
  position: relative;
}

.typewriter-text {
  display: inline-block;
  background: linear-gradient(
    120deg,
    #00d4ff 0%,
    #8b5cf6 25%,
    #00ff88 50%,
    #ff3366 75%,
    #00d4ff 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
}

.typewriter-cursor {
  display: inline-block;
  color: #00d4ff;
  font-weight: bold;
  animation: cursorPulse 1.5s ease-in-out infinite;
  text-shadow: 0 0 10px #00d4ff;
}

.cursor-blink {
  opacity: 1;
}

.typewriter-cursor:not(.cursor-blink) {
  opacity: 0;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes cursorPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* 不同的文字样式变体 */
.typewriter-container.style-neon .typewriter-text {
  color: #00d4ff;
  text-shadow: 
    0 0 5px #00d4ff,
    0 0 10px #00d4ff,
    0 0 15px #00d4ff,
    0 0 20px #00d4ff;
  animation: neonFlicker 2s ease-in-out infinite alternate;
}

.typewriter-container.style-gradient .typewriter-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientMove 4s ease infinite;
}

.typewriter-container.style-glitch .typewriter-text {
  color: #fff;
  position: relative;
}

.typewriter-container.style-glitch .typewriter-text::before,
.typewriter-container.style-glitch .typewriter-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.typewriter-container.style-glitch .typewriter-text::before {
  animation: glitch1 0.5s infinite;
  color: #ff0000;
  z-index: -1;
}

.typewriter-container.style-glitch .typewriter-text::after {
  animation: glitch2 0.5s infinite;
  color: #00ffff;
  z-index: -2;
}

@keyframes neonFlicker {
  0%, 100% {
    text-shadow: 
      0 0 5px #00d4ff,
      0 0 10px #00d4ff,
      0 0 15px #00d4ff,
      0 0 20px #00d4ff;
  }
  50% {
    text-shadow: 
      0 0 2px #00d4ff,
      0 0 5px #00d4ff,
      0 0 8px #00d4ff,
      0 0 12px #00d4ff;
  }
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes glitch1 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

@keyframes glitch2 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(2px, -2px); }
  40% { transform: translate(2px, 2px); }
  60% { transform: translate(-2px, -2px); }
  80% { transform: translate(-2px, 2px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .typewriter-cursor {
    font-size: 0.9em;
  }
}
</style>
