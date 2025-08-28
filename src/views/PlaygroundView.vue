<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ElementInspector from "../components/ElementInspector.vue";

gsap.registerPlugin(ScrollTrigger);

const codeInput = ref(`// 欢迎使用GSAP动画实验室！
// 这里是一个基础动画示例
gsap.to(".playground-box", {
  x: 200,
  y: 100,
  rotation: 360,
  scale: 1.5,
  duration: 2,
  ease: "power2.inOut",
  yoyo: true,
  repeat: 1
});`);

const isRunning = ref(false);
const statusMessage = ref("");

const runAnimation = () => {
  if (isRunning.value) return;

  isRunning.value = true;

  try {
    statusMessage.value = "正在执行动画...";

    // Reset the playground box
    gsap.set(".playground-box", { clearProps: "all" });

    // 创建安全的执行环境
    const executeCode = new Function(
      "gsap",
      "document",
      "window",
      `
      try {
        ${codeInput.value}
      } catch (error) {
        console.error("Animation execution error:", error);
        throw error;
      }
    `
    );

    // Execute the code with limited scope
    executeCode(gsap, document, window);

    statusMessage.value = "动画执行成功！";

    // Reset running state after animation
    setTimeout(() => {
      isRunning.value = false;
      statusMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Animation error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    statusMessage.value = "代码执行出错: " + errorMessage;
    setTimeout(() => {
      statusMessage.value = "";
    }, 5000);
    isRunning.value = false;
  }
};

const resetAnimation = () => {
  gsap.killTweensOf(".playground-box");
  gsap.set(".playground-box", { clearProps: "all" });
  isRunning.value = false;

  // 清除所有克隆元素
  document.querySelectorAll(".clone-box").forEach((el) => el.remove());

  // 重置主元素的样式
  const box = document.querySelector(".playground-box");
  if (box) {
    box.removeAttribute("style");
    gsap.set(box, { clearProps: "all" });
  }
};

const loadPreset = (preset: string) => {
  // 先重置之前的动画和元素
  resetAnimation();

  const presets = {
    basic: `// 基础动画
gsap.to(".playground-box", {
  x: 200,
  y: 100,
  rotation: 360,
  duration: 2,
  ease: "power2.out"
});`,

    timeline: `// 时间轴动画
var tl = gsap.timeline();
tl.to(".playground-box", { x: 100, duration: 0.5 })
  .to(".playground-box", { y: -50, duration: 0.5 })
  .to(".playground-box", { rotation: 360, duration: 0.5 })
  .to(".playground-box", { scale: 1.5, duration: 0.5 });`,

    bounce: `// 弹跳动画
gsap.to(".playground-box", {
  y: -100,
  duration: 0.6,
  ease: "power2.out",
  yoyo: true,
  repeat: 3
});`,

    morph: `// 变形动画
gsap.to(".playground-box", {
  borderRadius: "50%",
  backgroundColor: "#ff5722",
  scale: 1.2,
  duration: 1,
  ease: "elastic.out(1, 0.3)",
  yoyo: true,
  repeat: 1
});`,

    colors: `// 颜色渐变动画
gsap.to(".playground-box", {
  backgroundColor: "#ff1493",
  boxShadow: "0 0 20px #ff1493",
  duration: 2,
  yoyo: true,
  repeat: 1,
  ease: "sine.inOut"
});`,

    rotate3d: `// 3D旋转动画
gsap.to(".playground-box", {
  rotationY: 360,
  rotationX: 180,
  duration: 2,
  ease: "power1.inOut",
  transformPerspective: 800
});`,

    stagger: `// 交错动画示例
// 首先创建几个克隆元素
const box = document.querySelector(".playground-box");
const parent = box.parentElement;
box.style.position = "absolute";

// 清除之前可能存在的克隆元素
document.querySelectorAll(".clone-box").forEach(el => el.remove());

// 创建5个克隆
for (let i = 0; i < 5; i++) {
  const clone = box.cloneNode();
  clone.classList.add("clone-box");
  clone.style.opacity = "0.6";
  parent.appendChild(clone);
}

// 应用交错动画
gsap.to(".playground-box, .clone-box", {
  x: i => i * 20 - 40,
  y: i => i * 15 - 30,
  rotation: 90,
  scale: 0.8,
  duration: 1,
  stagger: 0.2,
  ease: "back.out"
});`,

    path: `// 曲线路径动画 (使用基础动画模拟)
const box = document.querySelector(".playground-box");
box.style.position = "absolute";

// 创建曲线路径动画时间轴
const tl = gsap.timeline({ repeat: 1, yoyo: true });

tl.to(".playground-box", {
  x: 100,
  y: -50,
  rotation: 45,
  duration: 1,
  ease: "power1.inOut"
})
.to(".playground-box", {
  x: 200,
  y: 0,
  rotation: 90,
  duration: 1,
  ease: "power1.inOut"
})
.to(".playground-box", {
  x: 300,
  y: 50,
  rotation: 135,
  duration: 1,
  ease: "power1.inOut"
});`,

    elastic: `// 弹性缓动动画
gsap.to(".playground-box", {
  x: 200,
  rotation: 90,
  scale: 2,
  duration: 2,
  ease: "elastic.out(1, 0.3)",
  yoyo: true,
  repeat: 1
});`,

    shake: `// 抖动效果
gsap.timeline()
  .to(".playground-box", {x: -10, duration: 0.1})
  .to(".playground-box", {x: 10, duration: 0.1})
  .to(".playground-box", {x: -8, duration: 0.1})
  .to(".playground-box", {x: 8, duration: 0.1})
  .to(".playground-box", {x: -5, duration: 0.1})
  .to(".playground-box", {x: 5, duration: 0.1})
  .to(".playground-box", {x: 0, duration: 0.1});`,
  };

  codeInput.value = presets[preset as keyof typeof presets] || presets.basic;
};

onMounted(() => {
  // Page entrance animation
  gsap.from(".playground-header", {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: "power3.out",
  });

  gsap.from(".playground-content", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    delay: 0.3,
    ease: "power2.out",
  });

  // Animate the playground box continuously
  gsap.to(".playground-box", {
    y: -10,
    duration: 2,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
  });
});
</script>

<template>
  <div class="playground-page">
    <div class="container">
      <!-- Header -->
      <div class="playground-header">
        <h1 class="page-title">动画实验室</h1>
        <p class="page-subtitle">在这里实时体验和测试GSAP动画效果</p>
      </div>

      <div class="playground-content">
        <!-- Code Editor Section -->
        <div class="editor-section">
          <div class="editor-header">
            <h3>动画代码</h3>
            <div class="preset-buttons">
              <button class="preset-btn" @click="loadPreset('basic')">基础</button>
              <button class="preset-btn" @click="loadPreset('timeline')">时间轴</button>
              <button class="preset-btn" @click="loadPreset('bounce')">弹跳</button>
              <button class="preset-btn" @click="loadPreset('morph')">变形</button>
              <button class="preset-btn" @click="loadPreset('colors')">颜色渐变</button>
              <button class="preset-btn" @click="loadPreset('rotate3d')">3D旋转</button>
              <button class="preset-btn" @click="loadPreset('stagger')">交错</button>
              <button class="preset-btn" @click="loadPreset('path')">路径</button>
              <button class="preset-btn" @click="loadPreset('elastic')">弹性</button>
              <button class="preset-btn" @click="loadPreset('shake')">抖动</button>
            </div>
          </div>

          <textarea
            v-model="codeInput"
            class="code-editor"
            placeholder="在这里输入你的GSAP动画代码..."
          ></textarea>

          <div class="editor-controls">
            <button class="control-btn run-btn" @click="runAnimation" :disabled="isRunning">
              {{ isRunning ? "运行中..." : "运行动画" }}
            </button>
            <button class="control-btn reset-btn" @click="resetAnimation">重置</button>
          </div>

          <!-- 状态提示 -->
          <div
            v-if="statusMessage"
            class="status-message"
            :class="{ error: statusMessage.includes('出错') }"
          >
            {{ statusMessage }}
          </div>
        </div>

        <!-- Preview Section -->
        <div class="preview-section">
          <div class="preview-header">
            <h3>动画预览</h3>
          </div>

          <div class="preview-area">
            <div class="playground-box"></div>
            <div class="grid-background"></div>
          </div>

          <div class="preview-info">
            <p>上面的蓝色方块是你的动画目标 (.playground-box)</p>
            <p>编写GSAP代码来控制它，然后点击"运行动画"</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 元素检查器 -->
    <ElementInspector />
  </div>
</template>

<style scoped>
.playground-page {
  min-height: 100vh;
  padding: 8rem 0 4rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.playground-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00adb5, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.page-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  margin: 0 auto;
}

.playground-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.editor-section,
.preview-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-header,
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-header h3,
.preview-header h3 {
  color: var(--text-color);
  font-size: 1.3rem;
  font-weight: 600;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
  max-width: 100%;
}

.preset-btn {
  padding: 0.4rem 0.8rem;
  background: rgba(0, 173, 181, 0.2);
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  flex: 0 0 auto;
}

.preset-btn:hover {
  background: var(--primary-color);
  color: var(--background-color);
}

.code-editor {
  width: 100%;
  height: 300px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: #00ff88;
  font-family: "Fira Code", monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.code-editor:focus {
  border-color: var(--primary-color);
}

.editor-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.control-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.run-btn {
  background: var(--primary-color);
  color: var(--background-color);
}

.run-btn:hover:not(:disabled) {
  background: #00c2cc;
  transform: translateY(-2px);
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  background: transparent;
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
}

.reset-btn:hover {
  background: var(--accent-color);
  color: var(--background-color);
}

.status-message {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--success-color);
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.3s ease;
}

.status-message.error {
  background: rgba(255, 51, 102, 0.1);
  border-color: rgba(255, 51, 102, 0.3);
  color: var(--accent-color);
}

.preview-area {
  height: 300px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.playground-box {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, var(--primary-color), #00ff88);
  border-radius: 8px;
  position: relative;
  z-index: 2;
  box-shadow: 0 5px 15px rgba(0, 173, 181, 0.3);
}

.preview-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-info p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .playground-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .editor-header,
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preset-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .preset-btn {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }

  .page-title {
    font-size: 2.5rem;
  }
}
</style>
