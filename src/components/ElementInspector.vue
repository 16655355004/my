<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

const isActive = ref(false);
const highlightBox = ref<HTMLElement>();
const tooltip = ref<HTMLElement>();
const currentElement = ref<HTMLElement | null>(null);
const isTooltipLocked = ref(false); // 新增：工具提示锁定状态
const lockedPosition = ref({ x: 0, y: 0 }); // 新增：锁定时的位置

// 高亮框的位置和尺寸
const boxStyle = ref({
  left: "0px",
  top: "0px",
  width: "0px",
  height: "0px",
  opacity: 0,
});

// 工具提示的位置和内容
const tooltipStyle = ref({
  left: "0px",
  top: "0px",
  opacity: 0,
});

const tooltipContent = ref({
  tagName: "",
  className: "",
  id: "",
  text: "",
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  display: "",
  position: "",
  zIndex: "",
  backgroundColor: "",
  color: "",
  fontSize: "",
  fontFamily: "",
  margin: "",
  padding: "",
  border: "",
  attributes: {} as Record<string, string>,
  childrenCount: 0,
  isVisible: true,
});

// 折叠状态管理
const collapsedSections = ref({
  dimensions: false,
  styles: false,
  boxModel: false,
  colors: false,
  other: false,
  attributes: true, // 默认折叠属性区块
  text: false,
});

// 切换区块折叠状态
const toggleSection = (section: keyof typeof collapsedSections.value) => {
  collapsedSections.value[section] = !collapsedSections.value[section];
};

// 切换检查器状态
const toggleInspector = () => {
  isActive.value = !isActive.value;

  if (isActive.value) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown); // 添加键盘事件监听
    document.addEventListener("scroll", handleScroll, true); // 监听所有滚动事件
    window.addEventListener("resize", handleResize); // 监听窗口大小变化
    document.body.style.cursor = "crosshair";
  } else {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("click", handleClick);
    document.removeEventListener("keydown", handleKeyDown); // 移除键盘事件监听
    document.removeEventListener("scroll", handleScroll, true);
    window.removeEventListener("resize", handleResize);
    document.body.style.cursor = "";
    isTooltipLocked.value = false; // 重置锁定状态
    hideHighlight();
  }
};

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (!isActive.value || isTooltipLocked.value) return;

  // 获取相对于视口的坐标
  const clientX = event.clientX;
  const clientY = event.clientY;

  // 使用视口坐标获取元素
  const element = document.elementFromPoint(clientX, clientY) as HTMLElement;

  // 忽略检查器自身的元素
  if (
    !element ||
    element.closest(".element-inspector") ||
    element.closest(".highlight-box") ||
    element.closest(".element-tooltip")
  ) {
    return;
  }

  currentElement.value = element;
  updateHighlight(element);
  updateTooltip(element, event);
};

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (!isActive.value) return;

  event.preventDefault();
  event.stopPropagation();

  if (currentElement.value) {
    // 如果已经锁定，则切换到新元素
    if (isTooltipLocked.value) {
      // 切换到新元素
      switchToNewElement(event);
    } else {
      // 首次锁定
      lockTooltip(event);
    }

    console.log("Selected element:", currentElement.value);

    // 添加点击动画效果
    if (highlightBox.value) {
      gsap.to(highlightBox.value, {
        scale: 1.05,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  }
};

// 锁定工具提示到当前元素
const lockTooltip = (event: MouseEvent) => {
  // 计算锁定位置
  calculateLockedPosition(event);

  // 锁定工具提示，使其可滚动
  isTooltipLocked.value = true;

  // 使工具提示可交互并应用锁定位置
  if (tooltip.value) {
    tooltip.value.style.pointerEvents = "auto";
    applyLockedPosition();
  }
};

// 切换到新元素
const switchToNewElement = (event: MouseEvent) => {
  // 获取点击位置的新元素
  const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;

  // 忽略检查器自身的元素
  if (
    !element ||
    element.closest(".element-inspector") ||
    element.closest(".highlight-box") ||
    element.closest(".element-tooltip")
  ) {
    return;
  }

  // 更新到新元素
  currentElement.value = element;
  updateHighlight(element);

  // 重新计算位置并应用
  calculateLockedPosition(event);
  applyLockedPosition();

  // 添加切换动画效果
  if (tooltip.value) {
    gsap.fromTo(
      tooltip.value,
      { scale: 0.95, opacity: 0.8 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }
};

// 计算锁定位置
const calculateLockedPosition = (event: MouseEvent) => {
  const scrollX =
    window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  const scrollY =
    window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

  // 工具提示的预估尺寸
  const tooltipWidth = 500; // 锁定时的宽度
  const tooltipHeight = Math.min(600, window.innerHeight * 0.8); // 锁定时的高度

  // 视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 初始位置基于点击位置
  let x = event.clientX + scrollX;
  let y = event.clientY + scrollY;

  // 水平位置调整 - 确保不超出右边界
  if (event.clientX + tooltipWidth > viewportWidth) {
    x = event.clientX + scrollX - tooltipWidth;
  }

  // 确保不超出左边界
  if (x < scrollX + 10) {
    x = scrollX + 10;
  }

  // 垂直位置调整 - 确保不超出下边界
  if (event.clientY + tooltipHeight > viewportHeight) {
    y = event.clientY + scrollY - tooltipHeight;
  }

  // 确保不超出上边界
  if (y < scrollY + 10) {
    y = scrollY + 10;
  }

  // 如果在移动设备上，使用视口坐标居中显示以获得更好的体验
  if (viewportWidth <= 768) {
    x = (viewportWidth - Math.min(tooltipWidth, viewportWidth * 0.9)) / 2;
    y = (viewportHeight - tooltipHeight) / 2;
  }

  lockedPosition.value = { x, y };
};

// 应用锁定位置
const applyLockedPosition = () => {
  if (tooltip.value) {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // 移动设备使用固定定位
      tooltip.value.style.position = "fixed";
      tooltip.value.style.left = lockedPosition.value.x + "px";
      tooltip.value.style.top = lockedPosition.value.y + "px";
    } else {
      // 桌面设备使用绝对定位
      tooltip.value.style.position = "absolute";
      tooltip.value.style.left = lockedPosition.value.x + "px";
      tooltip.value.style.top = lockedPosition.value.y + "px";
    }

    tooltip.value.style.transform = "none";
  }
};

// 解锁工具提示
const unlockTooltip = () => {
  isTooltipLocked.value = false;
  if (tooltip.value) {
    tooltip.value.style.pointerEvents = "none";
    // 重置transform以便正常的鼠标跟随模式
    tooltip.value.style.transform = "";

    // 添加解锁动画效果
    gsap.fromTo(
      tooltip.value,
      { scale: 1 },
      {
        scale: 0.95,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          if (tooltip.value) {
            gsap.set(tooltip.value, { scale: 1 });
          }
        },
      }
    );
  }
};

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isActive.value) return;

  // Escape键解锁工具提示
  if (event.key === "Escape" && isTooltipLocked.value) {
    event.preventDefault();
    unlockTooltip();
  }
};

// 处理滚动事件
const handleScroll = () => {
  if (!isActive.value || !currentElement.value) return;

  // 如果工具提示已锁定，不更新位置
  if (isTooltipLocked.value) return;

  // 滚动时更新高亮框位置
  updateHighlight(currentElement.value);
};

// 处理窗口大小变化
const handleResize = () => {
  if (!isActive.value || !currentElement.value) return;

  // 如果工具提示已锁定，重新计算位置以适应新的窗口大小
  if (isTooltipLocked.value) {
    // 基于当前锁定位置重新计算
    const event = {
      clientX:
        lockedPosition.value.x - (window.pageXOffset || document.documentElement.scrollLeft || 0),
      clientY:
        lockedPosition.value.y - (window.pageYOffset || document.documentElement.scrollTop || 0),
    } as MouseEvent;
    calculateLockedPosition(event);
    applyLockedPosition();
    return;
  }

  // 窗口大小变化时更新高亮框位置
  updateHighlight(currentElement.value);
};

// 更新高亮框
const updateHighlight = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();

  // 获取页面滚动偏移量（兼容不同浏览器）
  const scrollX =
    window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  const scrollY =
    window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

  // 计算元素在文档中的绝对位置
  const absoluteLeft = rect.left + scrollX;
  const absoluteTop = rect.top + scrollY;

  const newStyle = {
    left: absoluteLeft + "px",
    top: absoluteTop + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: 1,
  };

  // 使用GSAP进行丝滑动画
  gsap.to(boxStyle.value, {
    left: newStyle.left,
    top: newStyle.top,
    width: newStyle.width,
    height: newStyle.height,
    opacity: newStyle.opacity,
    duration: 0.08,
    ease: "power1.out",
  });
};

// 更新工具提示
const updateTooltip = (element: HTMLElement, event: MouseEvent) => {
  // 获取更详细的元素信息
  const classes = element.className ? element.className.split(" ").filter((c) => c.trim()) : [];
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  // 获取所有属性
  const attributes = Array.from(element.attributes).reduce((acc, attr) => {
    acc[attr.name] = attr.value;
    return acc;
  }, {} as Record<string, string>);

  tooltipContent.value = {
    tagName: element.tagName.toLowerCase(),
    className: classes.join(" ") || "",
    id: element.id || "",
    text: element.textContent?.trim().slice(0, 50) || "",
    // 尺寸信息
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    // 位置信息
    left: Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft)),
    top: Math.round(rect.top + (window.pageYOffset || document.documentElement.scrollTop)),
    // 样式信息
    display: computedStyle.display,
    position: computedStyle.position,
    zIndex: computedStyle.zIndex,
    backgroundColor: computedStyle.backgroundColor,
    color: computedStyle.color,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily.split(",")[0].replace(/['"]/g, ""),
    margin: `${computedStyle.marginTop} ${computedStyle.marginRight} ${computedStyle.marginBottom} ${computedStyle.marginLeft}`,
    padding: `${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingBottom} ${computedStyle.paddingLeft}`,
    border: computedStyle.border,
    // 其他属性
    attributes: attributes,
    // 子元素数量
    childrenCount: element.children.length,
    // 是否可见
    isVisible: computedStyle.visibility !== "hidden" && computedStyle.display !== "none",
  };

  // 计算工具提示位置 - 智能定位避免超出屏幕
  const scrollX =
    window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  const scrollY =
    window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

  // 视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 工具提示的预估尺寸
  const tooltipWidth = 420;
  const tooltipMaxHeight = Math.min(600, viewportHeight * 0.8); // 最大高度为视口的80%

  let tooltipX, tooltipY;

  if (isTooltipLocked.value) {
    // 如果工具提示已锁定，保持当前位置
    return;
  }

  // 计算初始位置
  tooltipX = event.clientX + scrollX + 15;
  tooltipY = event.clientY + scrollY - 10;

  // 水平位置调整 - 避免超出右边界
  if (event.clientX + tooltipWidth > viewportWidth) {
    tooltipX = event.clientX + scrollX - tooltipWidth - 15;
  }

  // 垂直位置调整 - 避免超出下边界
  if (event.clientY + tooltipMaxHeight > viewportHeight) {
    tooltipY = event.clientY + scrollY - tooltipMaxHeight + 10;
  }

  // 确保不超出左边界
  if (tooltipX < scrollX) {
    tooltipX = scrollX + 10;
  }

  // 确保不超出上边界
  if (tooltipY < scrollY) {
    tooltipY = scrollY + 10;
  }

  gsap.to(tooltipStyle.value, {
    left: tooltipX + "px",
    top: tooltipY + "px",
    opacity: 1,
    duration: 0.08,
    ease: "power1.out",
  });
};

// 隐藏高亮
const hideHighlight = () => {
  gsap.to(boxStyle.value, {
    opacity: 0,
    duration: 0.2,
    ease: "power2.out",
  });

  gsap.to(tooltipStyle.value, {
    opacity: 0,
    duration: 0.2,
    ease: "power2.out",
  });
};

// 获取元素描述文本
const getElementDescription = () => {
  const { tagName, className, id } = tooltipContent.value;
  let description = `<${tagName}`;

  if (id) {
    description += ` id="${id}"`;
  }

  if (className) {
    const classes = className
      .split(" ")
      .filter((c) => c.trim())
      .slice(0, 3);
    if (classes.length > 0) {
      description += ` class="${classes.join(" ")}"`;
      if (className.split(" ").filter((c) => c.trim()).length > 3) {
        description += "...";
      }
    }
  }

  description += ">";
  return description;
};

// 获取元素选择器
const getElementSelector = () => {
  const { tagName, className, id } = tooltipContent.value;

  if (id) {
    return `#${id}`;
  }

  if (className) {
    const firstClass = className.split(" ").filter((c) => c.trim())[0];
    if (firstClass) {
      return `.${firstClass}`;
    }
  }

  return tagName;
};

onMounted(() => {
  // 初始化高亮框样式
  if (highlightBox.value) {
    gsap.set(highlightBox.value, { opacity: 0 });
  }
  if (tooltip.value) {
    gsap.set(tooltip.value, { opacity: 0 });
  }
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("click", handleClick);
  document.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", handleResize);
  document.body.style.cursor = "";
});
</script>

<template>
  <!-- 检查器按钮 -->
  <div class="element-inspector">
    <button
      @click="toggleInspector"
      :class="['inspector-btn', { active: isActive }]"
      title="元素检查器"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ isActive ? "退出检查" : "元素检查" }}</span>
    </button>
  </div>

  <!-- 高亮框 -->
  <div v-if="isActive" ref="highlightBox" class="highlight-box" :style="boxStyle">
    <div class="highlight-border"></div>
  </div>

  <!-- 工具提示 -->
  <div
    v-if="isActive"
    ref="tooltip"
    class="element-tooltip"
    :style="tooltipStyle"
    :class="{ locked: isTooltipLocked }"
  >
    <div class="tooltip-content">
      <!-- 工具提示头部 -->
      <div class="tooltip-header">
        <div class="element-selector">{{ getElementSelector() }}</div>
        <button
          v-if="isTooltipLocked"
          @click="unlockTooltip"
          class="close-btn"
          title="关闭详细视图 (ESC)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- 锁定状态提示 -->
      <div v-if="isTooltipLocked" class="lock-notice">
        🔒 已锁定 - 可滚动查看 | 点击其他元素切换 | ESC解锁
      </div>

      <!-- 标签信息 -->
      <div class="element-tag" v-html="getElementDescription()"></div>

      <!-- 点击提示 -->
      <div v-if="!isTooltipLocked" class="click-hint">
        💡 点击元素锁定面板 | 再次点击其他元素切换 | ESC解锁
      </div>

      <!-- 尺寸和位置 -->
      <div class="info-section">
        <div class="info-title" @click="toggleSection('dimensions')">
          📐 尺寸 & 位置
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.dimensions }">▼</span>
        </div>
        <div v-if="!collapsedSections.dimensions" class="info-grid">
          <div class="info-item">
            <span class="info-label">宽度:</span>
            <span class="info-value">{{ tooltipContent.width }}px</span>
          </div>
          <div class="info-item">
            <span class="info-label">高度:</span>
            <span class="info-value">{{ tooltipContent.height }}px</span>
          </div>
          <div class="info-item">
            <span class="info-label">X:</span>
            <span class="info-value">{{ tooltipContent.left }}px</span>
          </div>
          <div class="info-item">
            <span class="info-label">Y:</span>
            <span class="info-value">{{ tooltipContent.top }}px</span>
          </div>
        </div>
      </div>

      <!-- 样式信息 -->
      <div class="info-section">
        <div class="info-title" @click="toggleSection('styles')">
          🎨 样式
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.styles }">▼</span>
        </div>
        <div v-if="!collapsedSections.styles" class="info-list">
          <div class="info-item">
            <span class="info-label">display:</span>
            <span class="info-value">{{ tooltipContent.display }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">position:</span>
            <span class="info-value">{{ tooltipContent.position }}</span>
          </div>
          <div v-if="tooltipContent.zIndex !== 'auto'" class="info-item">
            <span class="info-label">z-index:</span>
            <span class="info-value">{{ tooltipContent.zIndex }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">font-size:</span>
            <span class="info-value">{{ tooltipContent.fontSize }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">font-family:</span>
            <span class="info-value">{{ tooltipContent.fontFamily }}</span>
          </div>
        </div>
      </div>

      <!-- 盒模型 -->
      <div class="info-section">
        <div class="info-title" @click="toggleSection('boxModel')">
          📦 盒模型
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.boxModel }">▼</span>
        </div>
        <div v-if="!collapsedSections.boxModel" class="info-list">
          <div class="info-item">
            <span class="info-label">margin:</span>
            <span class="info-value">{{ tooltipContent.margin }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">padding:</span>
            <span class="info-value">{{ tooltipContent.padding }}</span>
          </div>
          <div v-if="tooltipContent.border !== '0px none rgb(0, 0, 0)'" class="info-item">
            <span class="info-label">border:</span>
            <span class="info-value">{{ tooltipContent.border }}</span>
          </div>
        </div>
      </div>

      <!-- 颜色 -->
      <div class="info-section">
        <div class="info-title" @click="toggleSection('colors')">
          🌈 颜色
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.colors }">▼</span>
        </div>
        <div v-if="!collapsedSections.colors" class="info-list">
          <div class="info-item">
            <span class="info-label">color:</span>
            <span class="info-value color-preview" :style="{ color: tooltipContent.color }">
              {{ tooltipContent.color }}
            </span>
          </div>
          <div v-if="tooltipContent.backgroundColor !== 'rgba(0, 0, 0, 0)'" class="info-item">
            <span class="info-label">background:</span>
            <span
              class="info-value color-preview"
              :style="{ backgroundColor: tooltipContent.backgroundColor }"
            >
              {{ tooltipContent.backgroundColor }}
            </span>
          </div>
        </div>
      </div>

      <!-- 其他信息 -->
      <div class="info-section">
        <div class="info-title" @click="toggleSection('other')">
          ℹ️ 其他
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.other }">▼</span>
        </div>
        <div v-if="!collapsedSections.other" class="info-list">
          <div class="info-item">
            <span class="info-label">子元素:</span>
            <span class="info-value">{{ tooltipContent.childrenCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">可见:</span>
            <span
              class="info-value"
              :class="{
                'status-visible': tooltipContent.isVisible,
                'status-hidden': !tooltipContent.isVisible,
              }"
            >
              {{ tooltipContent.isVisible ? "是" : "否" }}
            </span>
          </div>
        </div>
      </div>

      <!-- 属性 -->
      <div v-if="Object.keys(tooltipContent.attributes).length > 0" class="info-section">
        <div class="info-title" @click="toggleSection('attributes')">
          🏷️ 属性 ({{ Object.keys(tooltipContent.attributes).length }})
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.attributes }">▼</span>
        </div>
        <div v-if="!collapsedSections.attributes" class="info-list">
          <div v-for="(value, key) in tooltipContent.attributes" :key="key" class="info-item">
            <span class="info-label">{{ key }}:</span>
            <span class="info-value">{{
              value.length > 30 ? value.slice(0, 30) + "..." : value
            }}</span>
          </div>
        </div>
      </div>

      <!-- 文本内容 -->
      <div v-if="tooltipContent.text" class="info-section">
        <div class="info-title" @click="toggleSection('text')">
          📝 文本内容
          <span class="toggle-icon" :class="{ collapsed: collapsedSections.text }">▼</span>
        </div>
        <div v-if="!collapsedSections.text" class="element-text">
          "{{ tooltipContent.text }}{{ tooltipContent.text.length >= 50 ? "..." : "" }}"
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.element-inspector {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 9999;
}

.inspector-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 40, 49, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.inspector-btn:hover {
  background: rgba(34, 40, 49, 1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 173, 181, 0.2);
}

.inspector-btn.active {
  background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
  color: white;
  border-color: transparent;
}

.inspector-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 173, 181, 0.4);
}

.inspector-btn svg {
  transition: transform 0.3s ease;
}

.inspector-btn.active svg {
  transform: rotate(180deg);
}

/* 高亮框样式 */
.highlight-box {
  position: absolute;
  pointer-events: none;
  z-index: 9998;
  will-change: transform, opacity;
}

.highlight-border {
  width: 100%;
  height: 100%;
  border: 2px solid #00ff88;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(0, 255, 136, 0.3), inset 0 0 0 1px rgba(0, 255, 136, 0.2),
    0 4px 12px rgba(0, 255, 136, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 1px rgba(0, 255, 136, 0.3), inset 0 0 0 1px rgba(0, 255, 136, 0.2),
      0 4px 12px rgba(0, 255, 136, 0.2);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.5), inset 0 0 0 1px rgba(0, 255, 136, 0.3),
      0 6px 16px rgba(0, 255, 136, 0.3);
  }
}

/* 工具提示样式 */
.element-tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 10000;
  will-change: transform, opacity;
  transition: all 0.3s ease;
}

.element-tooltip.locked {
  pointer-events: auto;
  position: absolute;
  z-index: 10001;
  /* Position will be set by JavaScript */
}

.element-tooltip.locked::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
  backdrop-filter: blur(3px);
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  font-family: "Courier New", monospace;
  font-size: 0.75rem;
  max-width: 420px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  line-height: 1.3;
}

.element-tooltip.locked .tooltip-content {
  max-width: 500px;
  max-height: 80vh;
  min-height: 400px;
  border: 2px solid rgba(0, 255, 136, 0.6);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 136, 0.3);
  animation: locked-glow 2s ease-in-out infinite alternate;
}

@keyframes locked-glow {
  from {
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 136, 0.3);
  }
  to {
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 255, 136, 0.5);
  }
}

/* 工具提示头部 */
.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.element-selector {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  flex: 1;
}

.close-btn {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 8px;
  color: #ff6b6b;
  cursor: pointer;
  padding: 0.4rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: rgba(255, 107, 107, 0.6);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.close-btn:active {
  transform: scale(0.95);
}

.lock-notice {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 212, 255, 0.1));
  border: 1px solid rgba(0, 255, 136, 0.4);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  color: #00ff88;
  text-align: center;
  margin-bottom: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 255, 136, 0.1);
  animation: pulse-lock 3s ease-in-out infinite;
}

@keyframes pulse-lock {
  0%,
  100% {
    border-color: rgba(0, 255, 136, 0.4);
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.1);
  }
  50% {
    border-color: rgba(0, 255, 136, 0.6);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.2);
  }
}

.click-hint {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 0.65rem;
  color: #ffc107;
  text-align: center;
  margin-bottom: 0.5rem;
  font-style: italic;
  animation: pulse-hint 2s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.element-tag {
  color: #00ff88;
  font-weight: bold;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.element-text {
  color: #ccc;
  font-style: italic;
  word-break: break-word;
  font-size: 0.7rem;
  margin-top: 0.3rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 信息区块 */
.info-section {
  margin: 0.8rem 0;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.info-title {
  font-weight: bold;
  color: #00ff88;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  cursor: pointer;
  padding: 0.2rem 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.info-title:hover {
  background: rgba(0, 255, 136, 0.1);
  padding-left: 0.3rem;
  padding-right: 0.3rem;
}

.toggle-icon {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
  color: #88ccff;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 0;
}

.info-label {
  color: #88ccff;
  font-weight: 500;
  min-width: 80px;
  font-size: 0.7rem;
}

.info-value {
  color: #ffeb3b;
  font-weight: 400;
  text-align: right;
  word-break: break-all;
  max-width: 200px;
  font-size: 0.7rem;
}

.color-preview {
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-visible {
  color: #4caf50 !important;
}

.status-hidden {
  color: #f44336 !important;
}

/* 滚动条样式 */
.tooltip-content::-webkit-scrollbar {
  width: 6px;
}

.tooltip-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.tooltip-content::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 136, 0.5);
  border-radius: 3px;
}

.tooltip-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 136, 0.7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .element-inspector {
    bottom: 1rem;
    left: 1rem;
  }

  .inspector-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .inspector-btn span {
    display: none;
  }

  .tooltip-content {
    font-size: 0.65rem;
    padding: 0.75rem;
    max-width: 280px;
    max-height: 70vh;
  }

  .element-tooltip.locked .tooltip-content {
    max-width: 90vw;
    max-height: 85vh;
    min-height: 300px;
  }

  /* 移动设备上的锁定工具提示使用固定定位以获得更好的体验 */
  .element-tooltip.locked {
    position: fixed !important;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-value {
    max-width: 150px;
  }

  .info-title {
    font-size: 0.75rem;
  }
}
</style>
