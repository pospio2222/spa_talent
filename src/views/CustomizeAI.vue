<template>
  <div class="customize-ai-container">
    <PageBanner title="Customize AI" subtitle="Customize AI Models and Settings" />
    
    <div class="content-wrapper">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Customize AI</h1>
          <p class="hero-subtitle">
            <span class="business-plan-highlight">Available in our Enterprise Solutions plan</span> — customize AI to fit your needs, try different models, 
            explore algorithms, and compare results to find your perfect setup.
          </p>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        <n-card class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-cogs"></i>
          </div>
          <h3 class="feature-title">Customize AI</h3>
          <p class="feature-description">
            Fine-tune AI parameters, create custom prompts, and build specialized workflows 
            tailored to your specific use cases and requirements.
          </p>
        </n-card>

        <n-card class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-flask"></i>
          </div>
          <h3 class="feature-title">Experiment AI Algorithms</h3>
          <p class="feature-description">
            Test various AI algorithms, experiment with different approaches, and discover 
            innovative solutions through hands-on experimentation.
          </p>
        </n-card>

        <n-card class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3 class="feature-title">Test & Compare Outputs</h3>
          <p class="feature-description">
            Run multiple experiments simultaneously, compare results side-by-side, 
            and analyze performance metrics to optimize your AI solutions.
          </p>
        </n-card>
      </div>

      <!-- Info Section -->
      <n-card class="info-section">
        <h2 class="info-title">Why Choose Customize AI?</h2>
        <p class="info-text">
          Customize AI is our advanced AI customization platform designed for businesses that need 
          more than just basic AI tools. It's perfect for teams that want to fine-tune AI models, 
          experiment with different algorithms, and create custom AI solutions that perfectly fit 
          their unique requirements and workflows.
        </p>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
</script>

<style scoped>
.customize-ai-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

.hero-section {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
  border-radius: 20px;
  padding: 28px 24px;
  text-align: center;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 16px;
  line-height: 1.5;
}

.business-plan-highlight {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.feature-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4A90E2 0%, #4CAF50 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  color: white;
  font-size: 1.1rem;
}

.feature-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.feature-description {
  color: #64748b;
  line-height: 1.5;
  font-size: 0.92rem;
}

.info-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
}

.info-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.info-text {
  color: #475569;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-section { padding: 24px 16px; }
  .hero-title { font-size: 2rem; }
  .features-grid { grid-template-columns: 1fr; gap: 12px; }
  .feature-card { padding: 16px; }
}
</style>
