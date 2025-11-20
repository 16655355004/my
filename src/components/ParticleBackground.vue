<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

const canvasRef = ref<HTMLCanvasElement>()
const particles = ref<Particle[]>([])
const mouse = ref({ x: 0, y: 0 })
const animationId = ref<number>()

// 粒子配置
const config = {
  particleCount: 80,
  maxDistance: 120,
  mouseRadius: 150,
  colors: ['#00d4ff', '#8b5cf6', '#00ff88', '#ff3366'],
}

// 创建粒子
const createParticle = (canvas: HTMLCanvasElement): Particle => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.2,
    color: config.colors[Math.floor(Math.random() * config.colors.length)]
  }
}

// 初始化粒子
const initParticles = (canvas: HTMLCanvasElement) => {
  particles.value = []
  for (let i = 0; i < config.particleCount; i++) {
    particles.value.push(createParticle(canvas))
  }
}

// 更新粒子位置
const updateParticles = (canvas: HTMLCanvasElement) => {
  particles.value.forEach(particle => {
    // 基础移动
    particle.x += particle.vx
    particle.y += particle.vy

    // 边界检测
    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

    // 鼠标交互
    const dx = mouse.value.x - particle.x
    const dy = mouse.value.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < config.mouseRadius) {
      const force = (config.mouseRadius - distance) / config.mouseRadius
      particle.vx += (dx / distance) * force * 0.01
      particle.vy += (dy / distance) * force * 0.01
      particle.opacity = Math.min(1, particle.opacity + force * 0.02)
    } else {
      particle.opacity = Math.max(0.2, particle.opacity - 0.01)
    }

    // 限制速度
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
    if (speed > 2) {
      particle.vx = (particle.vx / speed) * 2
      particle.vy = (particle.vy / speed) * 2
    }
  })
}

// 绘制粒子
const drawParticles = (ctx: CanvasRenderingContext2D) => {
  particles.value.forEach(particle => {
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

// 绘制连线
const drawConnections = (ctx: CanvasRenderingContext2D) => {
  for (let i = 0; i < particles.value.length; i++) {
    for (let j = i + 1; j < particles.value.length; j++) {
      const p1 = particles.value[i]
      const p2 = particles.value[j]
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < config.maxDistance) {
        const opacity = (1 - distance / config.maxDistance) * 0.3
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.strokeStyle = '#00d4ff'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
        ctx.restore()
      }
    }
  }
}

// 动画循环
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 更新和绘制
  updateParticles(canvas)
  drawConnections(ctx)
  drawParticles(ctx)

  animationId.value = requestAnimationFrame(animate)
}

// 调整画布大小
const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initParticles(canvas)
}

// 鼠标移动事件
const handleMouseMove = (event: MouseEvent) => {
  mouse.value.x = event.clientX
  mouse.value.y = event.clientY
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  // 初始化
  resizeCanvas()
  animate()

  // 事件监听
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="particle-canvas"
  />
</template>

<style scoped>
.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.8;
}
</style>
