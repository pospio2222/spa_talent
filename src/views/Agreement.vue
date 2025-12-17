<template>
  <div class="agreement-container">
    <div class="agreement-card">
      <div class="agreement-header">
        <h1>User Agreement & Consent</h1>
        <p>Please review and accept the terms below to continue using 4AI, Inc. services</p>
      </div>

      <div class="terms-box">
        <div class="terms-header">Terms and Conditions</div>
        <div class="terms-content" v-html="termsContent"></div>
      </div>

      <div class="consent-section">
        <div class="required-note">
          <strong>Required:</strong> You must accept the required terms below to continue.
        </div>
        
        <div class="consent-item required">
          <n-checkbox v-model:checked="consentTerms">
            <strong>Terms of Service:</strong> I have read and agree to the Terms of Service and Acceptable Use Policy
          </n-checkbox>
        </div>
        
        <div class="consent-item required">
          <n-checkbox v-model:checked="consentPrivacy">
            <strong>Privacy Policy:</strong> I agree to the Privacy Policy and understand how my data is collected and used
          </n-checkbox>
        </div>
        
        <div class="consent-item required">
          <n-checkbox v-model:checked="consentDataProcessing">
            <strong>Data Processing:</strong> I consent to the processing of my personal data as described in the policies
          </n-checkbox>
        </div>
      </div>

      <div class="actions">
        <n-button @click="handleAccept" type="primary" :loading="submitting" :disabled="!canAccept">
          Accept and Continue
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NCheckbox, useMessage } from 'naive-ui'
import api from '@/utils/api'

const message = useMessage()
const submitting = ref(false)
const consentTerms = ref(false)
const consentPrivacy = ref(false)
const consentDataProcessing = ref(false)

const canAccept = computed(() => consentTerms.value && consentPrivacy.value && consentDataProcessing.value)

const termsContent = ref(`
  <h3>Terms of Use / Terms of Service</h3>
  <p><strong>Effective Date: December 2024</strong></p>
  <p>These Terms of Use ("Terms") govern your use of 4 AI, Inc.'s SaaS web platform ("Service"). By accessing or using the Service, you ("User," "you") agree to these Terms. If you do not agree, do not use the Service.</p>
  
  <h4>1. Scope & Acceptance</h4>
  <p>1.1 We provide a general-purpose web-based software application ("Service") for lawful use only. Your use is subject to these Terms.</p>
  <p>1.2 You are responsible for all input data, information, and content ("User Data") you or your end users upload or process using the Service.</p>
  
  <h4>2. User Data Responsibility</h4>
  <p>2.1 <strong>Content & Data Accuracy</strong><br>You are solely responsible for the legality, accuracy, quality, appropriateness, and reliability of all User Data submitted to the Service. We do not review or endorse any User Data.</p>
  <p>2.2 <strong>Lawful Collection & Consent</strong><br>You warrant that all User Data has been collected lawfully, and any required permissions or consents—especially for sensitive personal data—have been obtained. You will not use the Service to process data collected illegally or unethically.</p>
  <p>2.3 <strong>Zero Oversight or Endorsement</strong><br>We act purely as a technical processor of User Data. We do not monitor, screen, verify, endorse, or control the content of User Data and disclaim all responsibility for it.</p>
  
  <h4>3. Ethical & Legal Use</h4>
  <p>3.1 <strong>Neutral Platform</strong><br>Our Service is data- and ethics-agnostic. We do not impose moral, ethical, social, or equal-rights standards. All decisions about how User Data is used—including compliance with non-discrimination laws—are your responsibility.</p>
  <p>3.2 <strong>Prohibited Use</strong><br>You may not use the Service in any unlawful manner, including for unauthorized surveillance, discriminatory profiling, hacking, or other improper or illegal activities.</p>
  
  <h4>4. GDPR & Privacy Compliance</h4>
  <p>4.1 <strong>Processor Role</strong><br>Wherever applicable (e.g., processing of EU/EEA personal data), you act as the data controller and we act solely as a data processor under GDPR. You are responsible for determining the legal basis for processing, providing notices, and responding to data subject requests.</p>
  
  <h4>5. Account & Access</h4>
  <p>5.1 <strong>Credentials</strong><br>You are responsible for maintaining the confidentiality of all account credentials, and for all actions taken under your account. You must notify us immediately of any unauthorized access.</p>
  
  <h4>6. Individual AI Credits and Individual Plans</h4>
  <p>Individual AI Credits and Individual Plans are licensed strictly for personal use and non-commercial purposes. Use of non-company plans for company, organizational, or commercial purposes is strictly prohibited.</p>
  
  <h4>7. Disclaimer of Warranties & Liability Limitations</h4>
  <p>7.1 <strong>"As‑Is" Service</strong><br>The Service is provided "as is" and "as available," without warranties of any kind.</p>
  <p>7.2 <strong>Limitation of Liability</strong><br>To the maximum extent permitted by law, we disclaim all liability for any direct, indirect, special, incidental, consequential, or punitive damages arising out of or relating to User Data, misuse of the Service, or your failure to comply with laws.</p>
  
  <h4>8. Indemnity</h4>
  <p>You agree to indemnify and hold harmless our Company, its officers, directors, employees, and affiliates from any claims, losses, damages, liabilities, or expenses (including legal fees) arising out of your breach of these Terms.</p>
  
  <h4>9. Suspension & Termination</h4>
  <p>We reserve the right to immediately suspend or terminate your access if we believe you are violating these Terms or any applicable laws.</p>
  
  <h4>10. Modifications</h4>
  <p>We may update these Terms at any time by posting a revised version. Continued use of the Service after changes constitutes acceptance.</p>
  
  <h4>11. General Provisions</h4>
  <p>11.1 <strong>Governing Law</strong><br>These Terms are governed by the laws of the State of California, United States.</p>
  
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
  
  <h3>Privacy Policy</h3>
  <p><strong>Last Updated: December 2024</strong></p>
  <p>4 AI, Inc. ("Company," "we," "us," or "our") operates this web-based software service ("Service") and is committed to protecting your privacy.</p>
  
  <h4>1. Data We Collect</h4>
  <p>We collect account registration data (name, email, password) and automatically collected usage data (IP address, browser type, pages visited).</p>
  
  <h4>2. How We Use Your Data</h4>
  <p>To provide, operate, and maintain the Service; to authenticate you and manage your account; to analyze usage and improve features.</p>
  
  <h4>3. Your Rights</h4>
  <p>You have rights to access, rectify, erase, restrict processing, object to processing, and data portability under applicable privacy laws.</p>
  
  <h4>4. Contact</h4>
  <p>For questions about this Privacy Policy, contact: <strong>info@4aitechnology.com</strong></p>
  
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
  
  <h3>Acceptable Use Policy</h3>
  <p><strong>Effective Date: December 2024</strong></p>
  <p>This Acceptable Use Policy governs permitted and prohibited uses of the SaaS platform provided by 4 AI, Inc.</p>
  
  <h4>Prohibited Uses</h4>
  <p>You shall not use the Service to violate any applicable laws, store unlawful content, facilitate unauthorized access, deploy malware, impersonate others, send spam, or reverse engineer the Service.</p>
  
  <h4>Consequences of Violation</h4>
  <p>Violations may result in suspension or termination of your account, legal actions, or financial damages.</p>
`)

const handleAccept = async () => {
  if (!canAccept.value) {
    message.warning('Please accept all required terms to continue')
    return
  }

  submitting.value = true
  try {
    await api.post('https://accounts.api.4aitek.com/agreement/accept')
    message.success('Agreement accepted successfully')
    // Use window.location for hard redirect to ensure fresh auth state
    setTimeout(() => {
      window.location.href = '/console'
    }, 500)
  } catch (err: any) {
    console.error('Failed to accept agreement:', err)
    message.error(err.response?.data?.detail || 'Failed to accept agreement. Please try again.')
    submitting.value = false
  }
}

onMounted(() => {
  // Scroll to top
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.agreement-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agreement-card {
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.agreement-header {
  text-align: center;
  margin-bottom: 32px;
}

.agreement-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.agreement-header p {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.terms-box {
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  margin: 24px 0;
  overflow: hidden;
}

.terms-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 18px;
}

.terms-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 24px;
  background: #f8f9fa;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}

.terms-content h3 {
  color: #1a1a1a;
  font-size: 20px;
  margin-top: 24px;
  margin-bottom: 12px;
}

.terms-content h4 {
  color: #2d3748;
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 8px;
}

.terms-content p {
  margin: 8px 0;
}

.terms-content ul {
  margin: 8px 0;
  padding-left: 24px;
}

.terms-content hr {
  margin: 20px 0;
  border: none;
  border-top: 1px solid #ddd;
}

.consent-section {
  margin: 24px 0;
}

.required-note {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f1f5f9;
  border-radius: 8px;
}

.consent-item {
  padding: 10px 14px;
  margin: 4px 0;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.consent-item.required {
  border-left-color: #667eea;
}

.consent-item :deep(.n-checkbox) {
  font-size: 14px;
  line-height: 1.5;
}

.consent-item strong {
  color: #1a1a1a;
}

.actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.actions :deep(.n-button) {
  min-width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}
</style>
