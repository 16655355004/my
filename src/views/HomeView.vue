<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import TextPlugin from "gsap/TextPlugin";
import ElementInspector from "../components/ElementInspector.vue";

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger, TextPlugin);

const router = useRouter();

// 导航到锚点的函数
const navigateToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

// 生成随机代码片段
const getRandomCode = () => {
  const codeSnippets = [
    "const app = Vue.createApp({})",
    'gsap.to(".element", { x: 100 })',
    'import { ref, reactive } from "vue"',
    "function animate() { ... }",
    "export default { setup() }",
    "npm install gsap",
    'git commit -m "feat: add animation"',
    'console.log("Hello World")',
    "async function fetchData() {}",
    "const [state, setState] = useState()",
    "pip install requests",
    "def main(): pass",
    "class Component extends React",
    "SELECT * FROM users",
    "docker run -p 3000:3000",
    '{ "name": "vue-project" }',
    "background: linear-gradient()",
    "transform: translateX(100px)",
    "position: absolute; top: 0",
    "z-index: 999; opacity: 0.8",
  ];
  return codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
};

// 交互动画函数
const animateBox1 = () => {
  gsap.to(".demo-box-1", {
    rotation: "+=360",
    scale: 1.5,
    duration: 0.8,
    ease: "back.out(1.7)",
    yoyo: true,
    repeat: 1,
  });
};

const animateBox2 = () => {
  gsap.to(".demo-box-2", {
    x: 50,
    y: -30,
    rotation: 180,
    duration: 0.6,
    ease: "power2.inOut",
    yoyo: true,
    repeat: 1,
  });
};

const animateBox3 = () => {
  gsap.to(".demo-box-3", {
    borderRadius: "50%",
    backgroundColor: "#ff5722",
    scale: 1.3,
    duration: 0.7,
    ease: "elastic.out(1, 0.3)",
    yoyo: true,
    repeat: 1,
  });
};

const animateCircle = () => {
  gsap.to(".demo-circle", {
    scale: 0.5,
    rotation: 720,
    borderRadius: "20%",
    duration: 1,
    ease: "power3.inOut",
    yoyo: true,
    repeat: 1,
  });
};

const animateTriangle = () => {
  gsap.to(".demo-triangle", {
    rotation: 360,
    scale: 1.4,
    x: 30,
    duration: 0.8,
    ease: "bounce.out",
    yoyo: true,
    repeat: 1,
  });
};

const animateHexagon = () => {
  gsap.to(".demo-hexagon", {
    rotation: 180,
    scale: 1.2,
    skewX: 15,
    duration: 0.9,
    ease: "power2.inOut",
    yoyo: true,
    repeat: 1,
  });
};

const animateStar = () => {
  gsap.to(".demo-star", {
    rotation: 720,
    scale: 2,
    color: "#ffff00",
    textShadow: "0 0 20px #ffff00",
    duration: 1,
    ease: "power2.out",
    yoyo: true,
    repeat: 1,
  });
};

const features = ref([
  {
    title: "前端开发",
    description: "精通Vue.js、React等现代前端框架，擅长构建响应式用户界面",
    icon: "💻",
  },
  {
    title: "动画设计",
    description: "熟练使用GSAP创建流畅的动画效果，提升用户体验",
    icon: "✨",
  },
  {
    title: "Python编程",
    description: "掌握Python后端开发，能够构建高效的API和数据处理系统",
    icon: "🐍",
  },
  {
    title: "持续学习",
    description: "保持对新技术的热情，不断学习和探索前沿技术",
    icon: "📚",
  },
]);

const stats = ref([
  { number: "3+", label: "年开发经验" },
  { number: "50+", label: "完成项目" },
  { number: "10+", label: "技术栈" },
  { number: "100%", label: "学习热情" },
]);

const skills = ref([
  { name: "Vue.js", level: 90, color: "#4FC08D" },
  { name: "JavaScript", level: 85, color: "#F7DF1E" },
  { name: "Python", level: 80, color: "#3776AB" },
  { name: "GSAP", level: 75, color: "#88CE02" },
  { name: "CSS/SCSS", level: 85, color: "#1572B6" },
  { name: "TypeScript", level: 70, color: "#3178C6" },
]);

onMounted(() => {
  // Hero entrance animation
  const heroTl = gsap.timeline();

  heroTl
    .from(".hero-title", {
      opacity: 0,
      y: 100,
      duration: 1.2,
      ease: "power3.out",
    })
    .from(
      ".hero-subtitle",
      {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.6"
    )
    .from(
      ".hero-description",
      {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4"
    )
    .from(
      ".hero-buttons .btn",
      {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        duration: 0.6,
        ease: "back.out(1.7)",
      },
      "-=0.4"
    );

  // Animated text effect
  gsap.to(".animated-text", {
    text: "专注于创造优雅的数字体验",
    duration: 2,
    delay: 1.5,
    ease: "none",
  });

  // Features animation - 简化动画确保显示
  gsap.from(".feature-card", {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 0.6,
    delay: 0.5,
    ease: "power2.out",
  });

  // 备用动画，确保元素可见
  setTimeout(() => {
    gsap.set(".feature-card", { opacity: 1, y: 0 });
  }, 2000);

  // Stats animation
  gsap.from(".stat-item", {
    opacity: 0,
    scale: 0.8,
    stagger: 0.1,
    duration: 0.6,
    scrollTrigger: {
      trigger: ".stats-section",
      start: "top 80%",
    },
  });

  // 备用动画，确保统计数据可见
  setTimeout(() => {
    gsap.set(".stat-item", { opacity: 1, scale: 1 });
    gsap.set(".stat-number", { opacity: 1 });
    gsap.set(".stat-label", { opacity: 1 });
  }, 2000);

  // Skills progress animation - 简化确保显示
  gsap.from(".skill-item", {
    opacity: 0,
    x: -30,
    stagger: 0.1,
    duration: 0.6,
    delay: 1,
    ease: "power2.out",
  });

  // Animate skill progress bars - 简化动画
  gsap.to(".skill-progress", {
    width: (_, target) => target.dataset.level + "%",
    duration: 1.5,
    ease: "power2.out",
    stagger: 0.1,
    delay: 1.5,
  });

  // 备用显示机制
  setTimeout(() => {
    gsap.set(".skill-item", { opacity: 1, x: 0 });
    document.querySelectorAll(".skill-progress").forEach((el) => {
      const level = el.getAttribute("data-level");
      if (level) {
        gsap.set(el, { width: level + "%" });
      }
    });
  }, 3000);

  // Floating animation for demo elements
  gsap.to(".floating-demo", {
    y: -20,
    duration: 3,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    stagger: 0.5,
  });

  // 新增元素的动画
  gsap.to(".demo-triangle", {
    rotation: 360,
    duration: 8,
    ease: "none",
    repeat: -1,
  });

  gsap.to(".demo-hexagon", {
    rotation: -360,
    duration: 10,
    ease: "none",
    repeat: -1,
  });

  gsap.to(".demo-star", {
    scale: 1.2,
    duration: 2,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
  });

  // SVG线条动画
  gsap.fromTo(
    ".line-1",
    { strokeDasharray: "0 1000" },
    {
      strokeDasharray: "1000 0",
      duration: 3,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
    }
  );

  gsap.fromTo(
    ".line-2",
    { strokeDasharray: "0 1000" },
    {
      strokeDasharray: "1000 0",
      duration: 3,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1.5,
    }
  );

  // 初始化代码雨位置 - 使用nextTick确保DOM渲染完成
  nextTick(() => {
    document.querySelectorAll(".code-line").forEach((line) => {
      const element = line as HTMLElement;
      element.style.left = Math.random() * 100 + "%";
      element.style.animationDelay = Math.random() * 15 + "s";
      element.style.top = Math.random() * -100 + "vh"; // 确保从屏幕上方开始
    });
  });

  // Parallax background elements
  gsap.utils.toArray(".parallax-bg").forEach((bg) => {
    const element = bg as HTMLElement;
    const speed = element.dataset.speed || "0.2";

    gsap.to(element, {
      y: () => -window.innerHeight * parseFloat(speed),
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  });

  // 添加悬停动画效果
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        scale: 1.05,
        rotationY: 5,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        scale: 1,
        rotationY: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  });
});
</script>

<template>
  <div class="home-page">
    <!-- 背景装饰 -->
    <div class="background-decorations">
      <!-- 网格背景 -->
      <div class="grid-background"></div>

      <!-- 代码雨效果 -->
      <div class="code-rain">
        <div class="code-line" v-for="i in 20" :key="i">
          <span>{{ getRandomCode() }}</span>
        </div>
      </div>

      <!-- 浮动几何图形 -->
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>

      <!-- 原有的光晕效果 -->
      <div class="parallax-bg bg-circle bg-circle-1" data-speed="0.15"></div>
      <div class="parallax-bg bg-circle bg-circle-2" data-speed="0.1"></div>
      <div class="parallax-bg bg-circle bg-circle-3" data-speed="0.2"></div>
    </div>

    <!-- Hero Section -->
    <section class="hero-section" id="home">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">空空</h1>
          <p class="hero-subtitle animated-text">前端开发者 & 动画爱好者</p>
          <p class="hero-description">
            你好！我是空空，一名热爱前端开发和动画设计的程序员。
            专注于使用现代技术栈创建流畅、优雅的用户界面和交互体验。
            擅长Vue.js、React、Python，以及使用GSAP制作精美动画。
          </p>
          <div class="hero-buttons">
            <button class="btn btn-primary" @click="router.push('/playground')">动画实验室</button>
            <button class="btn btn-outline" @click="navigateToSection('about')">了解更多</button>
          </div>
        </div>

        <!-- Demo Animation Area -->
        <div class="hero-demo">
          <div class="demo-container">
            <div class="floating-demo demo-box-1" @click="animateBox1"></div>
            <div class="floating-demo demo-box-2" @click="animateBox2"></div>
            <div class="floating-demo demo-box-3" @click="animateBox3"></div>
            <div class="floating-demo demo-circle" @click="animateCircle"></div>

            <!-- 新增动画元素 -->
            <div class="demo-triangle" @click="animateTriangle"></div>
            <div class="demo-hexagon" @click="animateHexagon"></div>
            <div class="demo-star" @click="animateStar">⭐</div>

            <!-- 连接线动画 -->
            <svg class="connection-lines" viewBox="0 0 300 300">
              <path
                class="line-1"
                d="M50,50 Q150,100 250,50"
                stroke="url(#gradient1)"
                stroke-width="2"
                fill="none"
              />
              <path
                class="line-2"
                d="M50,150 Q150,200 250,150"
                stroke="url(#gradient2)"
                stroke-width="2"
                fill="none"
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: var(--primary-color); stop-opacity: 0" />
                  <stop offset="50%" style="stop-color: var(--primary-color); stop-opacity: 1" />
                  <stop offset="100%" style="stop-color: var(--primary-color); stop-opacity: 0" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: var(--purple-accent); stop-opacity: 0" />
                  <stop offset="50%" style="stop-color: var(--purple-accent); stop-opacity: 1" />
                  <stop offset="100%" style="stop-color: var(--purple-accent); stop-opacity: 0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section section">
      <div class="container">
        <h2 class="section-title">我的专业技能</h2>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section section">
      <div class="container">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills Progress Section -->
    <section class="skills-progress section">
      <div class="container">
        <h2 class="section-title">技能熟练度</h2>
        <div class="skills-grid">
          <div v-for="skill in skills" :key="skill.name" class="skill-item">
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-percentage">{{ skill.level }}%</span>
            </div>
            <div class="skill-bar">
              <div
                class="skill-progress"
                :data-level="skill.level"
                :style="{ backgroundColor: skill.color }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 元素检查器 -->
    <ElementInspector />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #0a0a0f 0%,
    #1a1a2e 25%,
    #16213e 50%,
    #0f3460 75%,
    #1a1a2e 100%
  );
}

/* 背景装饰 */
.background-decorations {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.2;
}

.bg-circle-1 {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, var(--primary-color) 0%, rgba(0, 0, 0, 0) 70%);
  top: -15vw;
  right: -15vw;
}

.bg-circle-2 {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, var(--accent-color) 0%, rgba(0, 0, 0, 0) 70%);
  bottom: -10vw;
  left: -10vw;
}

.bg-circle-3 {
  width: 30vw;
  height: 30vw;
  background: radial-gradient(circle, var(--purple-accent) 0%, rgba(0, 0, 0, 0) 70%);
  top: 30vh;
  left: 10vw;
}

/* 网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

/* 代码雨效果 */
.code-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.code-line {
  position: absolute;
  color: rgba(0, 212, 255, 0.5);
  font-family: "Courier New", monospace;
  font-size: 15px;
  white-space: nowrap;
  animation: codeRain 15s linear infinite;
  top: -100vh; /* 确保初始位置在屏幕上方 */
  will-change: transform; /* 优化动画性能 */
}

.code-line:nth-child(odd) {
  animation-delay: -5s;
  color: rgba(139, 92, 246, 0.5);
}

.code-line:nth-child(3n) {
  animation-delay: -10s;
  color: rgba(0, 255, 136, 0.5);
}

@keyframes codeRain {
  0% {
    transform: translateY(-100vh);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 浮动几何图形 */
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.shape {
  position: absolute;
  border: 1px solid rgba(0, 212, 255, 0.2);
  animation: float 20s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  border-radius: 50%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 15%;
  transform: rotate(45deg);
  animation-delay: -5s;
  border-color: rgba(139, 92, 246, 0.2);
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 40%;
  left: 70%;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  background: rgba(0, 255, 136, 0.1);
  border: none;
  animation-delay: -10s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  top: 80%;
  left: 30%;
  border-radius: 20px;
  animation-delay: -15s;
  border-color: rgba(255, 51, 102, 0.2);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(90deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
  75% {
    transform: translateY(-30px) rotate(270deg);
  }
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
  padding: 8rem 0 4rem;
}

.hero-section .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  max-width: 600px;
}

/* 标题雷电效果 */
.hero-title {
  position: relative;
  display: inline-block;
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(120deg, var(--primary-color), #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleLightning 3s infinite;
}

@keyframes titleLightning {
  0% {
    text-shadow: none;
    filter: brightness(1);
  }
  45% {
    text-shadow: none;
    filter: brightness(1);
  }
  46% {
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.4);
    filter: brightness(1.3);
  }
  47% {
    text-shadow: none;
    filter: brightness(1);
  }
  48% {
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.8),
      0 0 30px rgba(0, 212, 255, 0.4);
    filter: brightness(1.6);
  }
  49% {
    text-shadow: none;
    filter: brightness(1);
  }
  52% {
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.8),
      0 0 40px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 212, 255, 0.4);
    filter: brightness(1.8);
  }
  53% {
    text-shadow: none;
    filter: brightness(1);
  }
  100% {
    text-shadow: none;
    filter: brightness(1);
  }
}

.hero-title::before,
.hero-title::after {
  content: "";
  position: absolute;
  top: -40px;
  width: 3px;
  height: 0;
  background: linear-gradient(to bottom, transparent, var(--primary-color), #00ff88);
  opacity: 0;
  z-index: 1;
}

.hero-title::before {
  left: 30%;
  animation: lightningStrike1 3s infinite;
}

.hero-title::after {
  right: 30%;
  animation: lightningStrike2 3s infinite;
}

@keyframes lightningStrike1 {
  0% {
    height: 0;
    opacity: 0;
  }
  47% {
    height: 0;
    opacity: 0;
  }
  48% {
    height: 30px;
    opacity: 0.8;
  }
  51% {
    height: 60px;
    opacity: 0.9;
    transform: translateY(0) scaleY(1);
  }
  52% {
    height: 0;
    opacity: 0;
  }
  100% {
    height: 0;
    opacity: 0;
  }
}

@keyframes lightningStrike2 {
  0% {
    height: 0;
    opacity: 0;
  }
  48% {
    height: 0;
    opacity: 0;
  }
  50% {
    height: 40px;
    opacity: 0.7;
  }
  53% {
    height: 0;
    opacity: 0;
  }
  100% {
    height: 0;
    opacity: 0;
  }
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-weight: 600;
  min-height: 2rem;
}

.hero-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.hero-buttons {
  display: flex;
  gap: 1.5rem;
}

.hero-demo {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.demo-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.floating-demo {
  position: absolute;
  border-radius: 10px;
}

.demo-box-1 {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, var(--primary-color), var(--success-color));
  top: 50px;
  left: 50px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
}

.demo-box-2 {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, var(--purple-accent), var(--blue-accent));
  top: 150px;
  right: 80px;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

.demo-box-3 {
  width: 50px;
  height: 50px;
  background: linear-gradient(45deg, var(--success-color), var(--primary-color));
  bottom: 80px;
  left: 80px;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

.demo-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, var(--accent-color), #ff8a65);
  border-radius: 50%;
  top: 20px;
  right: 20px;
  box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
  cursor: pointer;
}

/* 新增动画元素 */
.demo-triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 45px solid var(--success-color);
  top: 120px;
  left: 20px;
  cursor: pointer;
  filter: drop-shadow(0 0 10px rgba(0, 255, 136, 0.4));
}

.demo-hexagon {
  position: absolute;
  width: 50px;
  height: 50px;
  background: var(--blue-accent);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  top: 200px;
  right: 60px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.demo-star {
  position: absolute;
  font-size: 2rem;
  top: 80px;
  left: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
}

.connection-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

/* 为所有demo元素添加cursor pointer */
.floating-demo {
  cursor: pointer;
}

/* Features Section */
.features-section {
  padding: 8rem 0;
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rem;
  background: linear-gradient(45deg, var(--text-color), var(--primary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  opacity: 1; /* 确保初始可见 */
  transform: translateY(0); /* 确保初始位置正确 */
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 173, 181, 0.2);
  border-color: var(--primary-color);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.feature-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  padding: 6rem 0;
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 2rem;
}

.stat-number {
  font-size: 3rem;
  font-weight: 900;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Skills Progress Section */
.skills-progress {
  padding: 8rem 0;
  position: relative;
  z-index: 2;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.skill-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  opacity: 1; /* 确保初始可见 */
  transform: translateX(0); /* 确保初始位置正确 */
}

.skill-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 173, 181, 0.15);
  border-color: rgba(0, 173, 181, 0.3);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.skill-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.skill-percentage {
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 500;
}

.skill-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.skill-progress {
  height: 100%;
  width: 0%;
  border-radius: 4px;
  position: relative;
  transition: width 0.3s ease;
}

.skill-progress::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Playground Section */
.playground-section {
  padding: 8rem 0;
  position: relative;
  z-index: 2;
  background: rgba(0, 0, 0, 0.1);
}

.playground-preview {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.playground-demo {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-box-mini {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, var(--primary-color), var(--purple-accent));
  border-radius: 10px;
  margin: 0 auto 2rem;
  animation: miniBoxFloat 3s ease-in-out infinite;
}

@keyframes miniBoxFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

.playground-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section .container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 3.5rem;
  }

  .hero-buttons,
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .section-title {
    font-size: 2.5rem;
  }

  .cta-title {
    font-size: 2.5rem;
  }

  /* 统计数据移动端样式 */
  .stats-section {
    padding: 4rem 0;
    display: block !important;
    visibility: visible !important;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    display: grid !important;
  }

  .stat-item {
    padding: 1.5rem 1rem;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .stat-number {
    font-size: 2.5rem;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    color: var(--primary-color) !important;
  }

  .stat-label {
    font-size: 1rem;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .bg-circle-1 {
    width: 70vw;
    height: 70vw;
  }

  .bg-circle-2 {
    width: 60vw;
    height: 60vw;
  }

  .bg-circle-3 {
    width: 40vw;
    height: 40vw;
  }

  .demo-container {
    width: 250px;
    height: 250px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stat-item {
    padding: 2rem 1rem;
  }

  .stat-number {
    font-size: 3rem;
    margin-bottom: 0.8rem;
  }

  .stat-label {
    font-size: 1.1rem;
  }
}
</style>
