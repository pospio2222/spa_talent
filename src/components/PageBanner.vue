<template>
  <header class="page-banner">
    <canvas ref="particleCanvas" class="banner-canvas"></canvas>
    <canvas ref="neuralCanvas" class="banner-canvas"></canvas>
    <div class="banner-content">
      <div class="banner-title">
        <h1>{{ title }}</h1>
        <p class="banner-subtitle">{{ subtitle }}</p>
      </div>
      <div class="banner-actions">
        <slot name="actions">
          <div v-if="showCredits" class="ai-credits-card">
            <div class="credits-icon">
              <i class="fas fa-coins"></i>
            </div>
            <div class="credits-content">
              <span class="credits-label">AI Credits</span>
              <span class="credits-number">{{ credits || '--' }}</span>
            </div>
          </div>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  title: string
  subtitle?: string
  showCredits?: boolean
  credits?: string | number
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  showCredits: false,
  credits: '--'
})

const particleCanvas = ref<HTMLCanvasElement | null>(null)
const neuralCanvas = ref<HTMLCanvasElement | null>(null)

let particles: any[] = []
let neurons: any[] = []
let mouseX = 0
let mouseY = 0
let time = 0
let animationId: number | null = null

function resize() {
  if (!particleCanvas.value || !neuralCanvas.value) return
  
  const banner = particleCanvas.value.parentElement
  if (!banner) return
  
  const rect = banner.getBoundingClientRect()
  particleCanvas.value.width = neuralCanvas.value.width = rect.width
  particleCanvas.value.height = neuralCanvas.value.height = rect.height
  initParticles()
  initNeuralNetwork()
}

function initParticles() {
  if (!particleCanvas.value) return
  
  particles = []
  const numParticles = Math.floor((particleCanvas.value.width * particleCanvas.value.height) / 8000)
  
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * particleCanvas.value.width,
      y: Math.random() * particleCanvas.value.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      originalSize: Math.random() * 2 + 1,
      color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2
    })
  }
}

function initNeuralNetwork() {
  if (!neuralCanvas.value) return
  
  neurons = []
  const numNeurons = Math.floor(neuralCanvas.value.width / 80)
  
  for (let i = 0; i < numNeurons; i++) {
    neurons.push({
      x: Math.random() * neuralCanvas.value.width,
      y: Math.random() * neuralCanvas.value.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 3 + 2,
      activation: Math.random(),
      charge: Math.random() * 0.5,
      pulsePhase: Math.random() * Math.PI * 2
    })
  }
}

function drawParticles() {
  if (!particleCanvas.value) return
  
  const ctx = particleCanvas.value.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, particleCanvas.value.width, particleCanvas.value.height)
  
  particles.forEach((particle, index) => {
    particle.x += particle.vx
    particle.y += particle.vy
    
    if (particle.x < 0 || particle.x > particleCanvas.value!.width) particle.vx *= -1
    if (particle.y < 0 || particle.y > particleCanvas.value!.height) particle.vy *= -1
    
    particle.pulse += 0.02
    particle.size = particle.originalSize + Math.sin(particle.pulse) * 0.5
    
    const dx = mouseX - particle.x
    const dy = mouseY - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 100) {
      const force = (100 - distance) / 100
      particle.vx += dx * force * 0.001
      particle.vy += dy * force * 0.001
      particle.alpha = Math.min(1, particle.alpha + force * 0.01)
    }
    
    ctx.save()
    ctx.globalAlpha = particle.alpha
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    )
    gradient.addColorStop(0, particle.color)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
    
    for (let j = index + 1; j < particles.length; j++) {
      const other = particles[j]
      const dist = Math.sqrt(
        Math.pow(particle.x - other.x, 2) + 
        Math.pow(particle.y - other.y, 2)
      )
      
      if (dist < 120) {
        ctx.save()
        ctx.globalAlpha = (120 - dist) / 120 * 0.2
        ctx.strokeStyle = `hsl(${220 + Math.sin(time * 0.001) * 20}, 60%, 70%)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(other.x, other.y)
        ctx.stroke()
        ctx.restore()
      }
    }
  })
}

function drawNeuralNetwork() {
  if (!neuralCanvas.value) return
  
  const ctx = neuralCanvas.value.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, neuralCanvas.value.width, neuralCanvas.value.height)
  
  neurons.forEach(neuron => {
    neuron.x += neuron.vx
    neuron.y += neuron.vy
    
    if (neuron.x < 0 || neuron.x > neuralCanvas.value!.width) neuron.vx *= -1
    if (neuron.y < 0 || neuron.y > neuralCanvas.value!.height) neuron.vy *= -1
    
    neuron.pulsePhase += 0.03
    neuron.activation = (Math.sin(neuron.pulsePhase) + 1) / 2
    neuron.charge = Math.sin(time * 0.002 + neuron.pulsePhase) * 0.5 + 0.5
  })
  
  neurons.forEach((neuron, i) => {
    neurons.slice(i + 1).forEach(otherNeuron => {
      const distance = Math.sqrt(
        Math.pow(neuron.x - otherNeuron.x, 2) + 
        Math.pow(neuron.y - otherNeuron.y, 2)
      )
      
      if (distance < 150) {
        const connectionStrength = (150 - distance) / 150
        const pulseIntensity = (neuron.activation + otherNeuron.activation) / 2
        
        ctx.save()
        ctx.globalAlpha = connectionStrength * pulseIntensity * 0.3
        ctx.strokeStyle = `hsl(${180 + pulseIntensity * 60}, 80%, 60%)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(neuron.x, neuron.y)
        ctx.lineTo(otherNeuron.x, otherNeuron.y)
        ctx.stroke()
        
        if (pulseIntensity > 0.7) {
          const midX = (neuron.x + otherNeuron.x) / 2
          const midY = (neuron.y + otherNeuron.y) / 2
          
          ctx.globalAlpha = pulseIntensity * 0.5
          ctx.fillStyle = `hsl(${200 + pulseIntensity * 40}, 90%, 70%)`
          ctx.beginPath()
          ctx.arc(midX, midY, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
    })
  })
}

function animate() {
  time++
  drawParticles()
  drawNeuralNetwork()
  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  if (!particleCanvas.value) return
  const rect = particleCanvas.value.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top
}

onMounted(() => {
  resize()
  animate()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.page-banner {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  border-radius: 0 0 24px 24px;
  padding: 0.33rem 2rem;
  margin: 0;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-top: none;
  min-height: 27px;
  display: flex;
  align-items: center;
}

.page-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
  z-index: 0;
}

.page-banner::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    rgba(59, 130, 246, 0.1) 0%,
    rgba(16, 185, 129, 0.1) 25%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(59, 130, 246, 0.1) 75%,
    rgba(16, 185, 129, 0.1) 100%);
  border-radius: 0 0 24px 24px;
  z-index: -1;
  animation: borderGlow 3s ease-in-out infinite;
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.banner-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.banner-canvas:first-of-type {
  z-index: 1;
}

.banner-canvas:last-of-type {
  z-index: 2;
}

.banner-content {
  position: relative;
  z-index: 3;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.banner-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 400;
  margin: 0;
}

.banner-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.ai-credits-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 50%, #10b981 100%);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  color: white;
}

.credits-icon {
  font-size: 1.25rem;
}

.credits-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.credits-label {
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 500;
}

.credits-number {
  font-size: 1rem;
  font-weight: 700;
}
</style>

