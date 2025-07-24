<script setup lang="ts">
import { ref, onMounted } from "vue";
import gsap from "gsap";
import { useRouter } from "vue-router";
import { getCurrentYear } from "../../utils/date";

const router = useRouter();
const currentYear = ref(new Date().getFullYear());

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  // Animate footer elements
  gsap.from(".footer-content", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    scrollTrigger: {
      trigger: ".footer",
      start: "top 95%",
    },
  });
});
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <span>空空</span>
        </div>

        <div class="footer-links">
          <div class="footer-link-group">
            <h4>导航</h4>
            <ul>
              <li><router-link to="/">首页</router-link></li>
              <li><router-link to="/about">关于我</router-link></li>
              <li><router-link to="/projects">项目展示</router-link></li>
              <li><router-link to="/skills">技能专长</router-link></li>
              <li><router-link to="/contact">联系方式</router-link></li>
            </ul>
          </div>

          <div class="footer-link-group">
            <h4>联系我</h4>
            <ul>
              <li><a href="mailto:kongkong@example.com">kongkong@example.com</a></li>
              <li>+86 123 4567 8910</li>
              <li>中国上海市</li>
            </ul>
          </div>

          <div class="footer-link-group">
            <h4>社交媒体</h4>
            <div class="footer-social">
              <a href="#" class="social-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  ></path>
                </svg>
              </a>
              <a href="#" class="social-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" class="social-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                  ></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ getCurrentYear() }} 空空. 保留所有权利</p>
      </div>

      <button class="scroll-top-btn" @click="scrollToTop" title="返回顶部">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: rgba(34, 40, 49, 0.95);
  padding: 5rem 0 2rem;
  position: relative;
  border-top: 1px solid rgba(238, 238, 238, 0.1);
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 4rem;
  margin-bottom: 3rem;
}

.footer-logo {
  font-size: 2rem;
  font-weight: 700;
}

.footer-logo span {
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.footer-link-group h4 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  position: relative;
}

.footer-link-group h4::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 30px;
  height: 2px;
  background-color: var(--primary-color);
}

.footer-link-group ul {
  list-style: none;
  padding: 0;
}

.footer-link-group li {
  margin-bottom: 0.8rem;
}

.footer-link-group a {
  color: var(--text-color);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.footer-link-group a:hover {
  color: var(--primary-color);
  opacity: 1;
}

.footer-social {
  display: flex;
  gap: 1rem;
}

.social-icon {
  width: 40px;
  height: 40px;
  background-color: rgba(57, 62, 70, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  transition: all 0.3s ease;
  border: 1px solid rgba(238, 238, 238, 0.1);
}

.social-icon:hover {
  background-color: var(--primary-color);
  transform: translateY(-3px);
}

.footer-bottom {
  border-top: 1px solid rgba(238, 238, 238, 0.1);
  padding-top: 2rem;
  text-align: center;
}

.footer-bottom p {
  opacity: 0.7;
  font-size: 0.9rem;
}

.scroll-top-btn {
  position: absolute;
  right: 30px;
  bottom: 30px;
  width: 50px;
  height: 50px;
  background-color: var(--primary-color);
  border: none;
  border-radius: 50%;
  color: var(--background-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.scroll-top-btn:hover {
  background-color: var(--secondary-color);
  transform: translateY(-5px);
}

@media (max-width: 992px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .footer-logo {
    text-align: center;
  }
}

@media (max-width: 768px) {
  .footer-links {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer {
    padding: 4rem 0 5rem;
  }
}
</style>
