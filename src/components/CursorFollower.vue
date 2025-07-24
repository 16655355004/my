<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

// 光标位置
const cursorX = ref(0);
const cursorY = ref(0);
const cursorVisible = ref(false);
const cursorScale = ref(1);
const cursorOpacity = ref(1);

// 光标元素引用
const cursor = ref<HTMLElement | null>(null);
const cursorDot = ref<HTMLElement | null>(null);

// 跟踪鼠标位置
const onMouseMove = (e: MouseEvent) => {
  cursorX.value = e.clientX;
  cursorY.value = e.clientY;

  if (!cursorVisible.value) {
    cursorVisible.value = true;
    if (cursor.value) {
      gsap.to(cursor.value, {
        opacity: 1,
        duration: 0.3,
      });
    }
  }

  // 更新光标位置
  updateCursorPosition();
};

// 当鼠标离开窗口时隐藏光标
const onMouseLeave = () => {
  cursorVisible.value = false;
  if (cursor.value) {
    gsap.to(cursor.value, {
      opacity: 0,
      duration: 0.3,
    });
  }
};

// 当鼠标点击时的动画效果
const onMouseDown = () => {
  cursorScale.value = 0.8;
  updateCursorTransform();
};

// 当鼠标释放时的动画效果
const onMouseUp = () => {
  cursorScale.value = 1;
  updateCursorTransform();
};

// 更新光标位置
const updateCursorPosition = () => {
  if (cursor.value) {
    gsap.to(cursor.value, {
      x: cursorX.value,
      y: cursorY.value,
      duration: 0.15,
    });
  }

  if (cursorDot.value) {
    gsap.to(cursorDot.value, {
      x: cursorX.value,
      y: cursorY.value,
      duration: 0.1,
    });
  }
};
//62rbmrcbpea4
// 更新光标变换
const updateCursorTransform = () => {
  if (cursor.value) {
    gsap.to(cursor.value, {
      scale: cursorScale.value,
      opacity: cursorOpacity.value,
      duration: 0.2,
    });
  }
};

// 检测可交互元素
const checkInteractive = () => {
  const interactiveElements = document.querySelectorAll(
    "a, button, .interactive, .demo-card, .filter-btn, .nav-link"
  );

  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursorScale.value = 1.8;
      cursorOpacity.value = 0.9;
      updateCursorTransform();

      // 添加特殊效果类
      if (cursor.value) {
        cursor.value.classList.add("cursor-hover");
      }
    });

    el.addEventListener("mouseleave", () => {
      cursorScale.value = 1;
      cursorOpacity.value = 1;
      updateCursorTransform();

      // 移除特殊效果类
      if (cursor.value) {
        cursor.value.classList.remove("cursor-hover");
      }
    });
  });
};

onMounted(() => {
  // 添加事件监听
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mouseleave", onMouseLeave);

  // 检测可交互元素
  setTimeout(checkInteractive, 500);

  // 初始化时隐藏默认光标
  document.body.classList.add("custom-cursor");
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("mouseleave", onMouseLeave);

  // 恢复默认光标
  document.body.classList.remove("custom-cursor");
});
</script>

<template>
  <div class="cursor-container">
    <!-- 主光标 -->
    <div ref="cursor" class="cursor"></div>
    <!-- 跟随点 -->
    <div ref="cursorDot" class="cursor-dot"></div>
  </div>
</template>

<style>
/* 隐藏默认光标 */
.custom-cursor {
  cursor: none;
}

.custom-cursor a,
.custom-cursor button,
.custom-cursor .interactive {
  cursor: none;
}

/* 在移动设备上显示默认光标 */
@media (max-width: 768px) {
  .custom-cursor {
    cursor: auto;
  }

  .custom-cursor a,
  .custom-cursor button,
  .custom-cursor .interactive {
    cursor: pointer;
  }
}
</style>

<style scoped>
.cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.cursor {
  position: fixed;
  top: -16px;
  left: -16px;
  width: 32px;
  height: 32px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  opacity: 0;
  transform: translate(0, 0);
  pointer-events: none;
  transition: all 0.15s ease;
  z-index: 9999;
  background: rgba(0, 212, 255, 0.1);
  backdrop-filter: blur(2px);
}

.cursor-dot {
  position: fixed;
  top: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  opacity: 0.8;
  transform: translate(0, 0);
  pointer-events: none;
  z-index: 10000;
  box-shadow: 0 0 8px var(--primary-color);
}

/* 悬停状态 */
.cursor.cursor-hover {
  border-color: var(--purple-accent);
  background: rgba(139, 92, 246, 0.15);
  transform: scale(1.5);
}

.cursor.cursor-hover + .cursor-dot {
  background: var(--purple-accent);
  box-shadow: 0 0 12px var(--purple-accent);
  transform: scale(1.2);
}

/* 媒体查询 - 在移动设备上禁用自定义光标 */
@media (max-width: 768px) {
  .cursor,
  .cursor-trail {
    display: none;
  }
}
</style>
