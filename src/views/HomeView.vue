<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import TextPlugin from "gsap/TextPlugin";
import ElementInspector from "../components/ElementInspector.vue";
import WebsiteStatistics from "../components/WebsiteStatistics.vue";
import ProjectLinks from "../components/ProjectLinks.vue";
import FloatingCard3D from "../components/FloatingCard3D.vue";
import TypewriterEffect from "../components/TypewriterEffect.vue";

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

const features = ref([
  {
    title: "前端开发",
    description: "精通Vue.js、React等现代前端框架，擅长构建响应式用户界面",
    icon: "💻",
    color: "#00d4ff",
  },
  {
    title: "动画设计",
    description: "熟练使用GSAP创建流畅的动画效果，提升用户体验",
    icon: "✨",
    color: "#8b5cf6",
  },
  {
    title: "Python编程",
    description: "掌握Python后端开发，能够构建高效的API和数据处理系统",
    icon: "🐍",
    color: "#00ff88",
  },
  {
    title: "团队合作",
    description: "善于与团队协作，能够快速适应新的工作环境和项目需求",
    icon: "🤝",
    color: "#ff3366",
  },
  {
    title: "持续学习",
    description: "保持对新技术的热情，不断学习和探索前沿技术",
    icon: "📚",
    color: "#ffd700",
  },
]);

// 打字机文本数组
const typewriterTexts = ref([
  "此情可待成追忆？只是当时已惘然",
  "车塞于途，人囚于市，鱼死于江海",
  "孤独的夜晚，星光也显得黯淡，仿佛连它们都在为我的忧伤而沉默。",
  "云中君不见，竟夕自悲秋",
  "怅望千秋一洒泪，萧条异代不同时",
  "人面不知何处去，桃花依旧笑春风。",
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
    <!-- Hero Section -->
    <section class="hero-section" id="home">
      <div class="container">
        <!-- 主要内容居中 -->
        <div class="hero-content">
          <h1 class="hero-title">JisooLove</h1>
          
          <!-- <div class="hero-subtitle-container">
            <TypewriterEffect
              :texts="typewriterTexts"
              :speed="80"
              :delete-speed="40"
              :pause-duration="2500"
              class="hero-subtitle"
            />
          </div> -->
          
          <div class="hero-buttons">
            
            <button class="btn btn-outline" @click="navigateToSection('about')">了解更多</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Links Section -->
    <ProjectLinks />

    <!-- Features Section -->
    <section class="features-section section">
      <div class="container">
        <h2 class="section-title">我的专业技能</h2>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <!-- <section class="stats-section section">
      <div class="container">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section> -->

    <!-- Skills Progress Section -->
    <section class="skills-progress section">
      <div class="container">
        <h2 class="section-title">技能熟练度</h2>
        <!-- 技能条展示 -->
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

    <!-- 网站统计区域 - 放在页面最下面 -->
    <section class="statistics-section">
      <div class="container">
        <WebsiteStatistics />
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
  background: var(--background-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: background-color, background-image;
  transform: translateZ(0);
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  padding: 0;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4));
  z-index: 1;
}

.hero-section .container {
  position: relative;
  z-index: 2;
}

[data-theme="light"] .hero-section {
  background-color: var(--background-color);
}

[data-theme="dark"] .hero-section {
  background-color: var(--background-color);
}

[data-theme="dark"] .features-section {
  background-color: var(--background-color);
}

[data-theme="light"] .features-section {
  background-color: var(--background-color);
}

[data-theme="dark"] .stats-section {
  background-color: var(--background-color);
}

[data-theme="light"] .stats-section {
  background-color: var(--background-color);
}

[data-theme="dark"] .skills-progress {
  background-color: var(--background-color);
}
[data-theme="light"] .skills-progress {
  background-color: var(--background-color);
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
  color: var(--text-secondary);
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
  background: var(--card-background);
  border-radius: 15px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px var(--shadow-color), 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.skill-item::after {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.skill-item:hover::after {
  opacity: 1;
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
  background: var(--divider-color);
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
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section .container {
    padding: 2rem 1rem;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .hero-content {
    max-width: 100%;
    margin: 0 auto;
  }

  .statistics-section {
    min-height: auto;
    padding: 2rem 0;
  }

  .statistics-section .container {
    padding: 0 1rem;
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
