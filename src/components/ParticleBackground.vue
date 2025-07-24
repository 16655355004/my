<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

let particles: Particle[] = []
let animationId: number

const createParticles = (canvas: HTMLCanvasElement) => {
  const particleCount = 50
  particles = []

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: `hsl(${180 + Math.random() * 60}, 70%, 60%)`
    })
  }
}

const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particles.forEach((particle, index) => {
    // 更新位置
    particle.x += particle.vx
    particle.y += particle.vy

    // 边界检测
    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

    // 绘制粒子
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 绘制连接线
    particles.slice(index + 1).forEach(otherParticle => {
      const dx = particle.x - otherParticle.x
      const dy = particle.y - otherParticle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 100) {
        ctx.save()
        ctx.globalAlpha = (100 - distance) / 100 * 0.2
        ctx.strokeStyle = '#00d4ff'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(otherParticle.x, otherParticle.y)
        ctx.stroke()
        ctx.restore()
      }
    })
  })
}

const animate = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  drawParticles(ctx, canvas)
  animationId = requestAnimationFrame(() => animate(ctx, canvas))
}

const resizeCanvas = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  createParticles(canvas)
}

onMounted(() => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()
  animate(ctx, canvas)

  window.addEventListener('resize', resizeCanvas)

  // 清理函数
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    window.removeEventListener('resize', resizeCanvas)
  }
})
</script>

<template>
  <canvas 
    ref="canvasRef"
    class="particle-canvas"
  ></canvas>
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
  opacity: 0.6;
}
</style>