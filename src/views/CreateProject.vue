<template>
  <div class="page-container">
    <PageBanner
      title="Create New Recruiting Project"
      subtitle="Set up a new project with job description and requirements"
    />

    <div class="content-wrapper">
      <div class="form-container">
        <n-card class="form-card">
          <n-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="top"
            require-mark-placement="right-hanging"
          >
            <n-form-item label="Project Name" path="project_name">
              <n-input
                v-model:value="formData.project_name"
                placeholder="e.g., Senior Software Engineer Hiring Q1 2025"
              />
            </n-form-item>

            <n-form-item label="Company" path="company">
              <n-input
                v-model:value="formData.company"
                placeholder="Company name"
              />
            </n-form-item>

            <n-form-item label="Position Category" path="position_category">
              <n-select
                v-model:value="formData.position_category"
                :options="positionCategoryOptions"
                placeholder="Select position category"
              />
            </n-form-item>

            <n-form-item label="Position Title" path="position_title">
              <n-input
                v-model:value="formData.position_title"
                placeholder="e.g., Senior Software Engineer"
              />
            </n-form-item>

            <n-form-item label="Description" path="description">
              <n-input
                v-model:value="formData.description"
                type="textarea"
                placeholder="Brief description of the project (optional)"
                :autosize="{
                  minRows: 3,
                  maxRows: 5
                }"
              />
            </n-form-item>

            <n-form-item label="Job Description File" path="jd_file" required>
              <n-upload
                ref="jdUploadRef"
                :max="1"
                :default-upload="false"
                @change="handleJDFileChange"
                accept=".pdf,.docx,.txt,.md"
              >
                <n-button>
                  <template #icon>
                    <i class="fas fa-upload"></i>
                  </template>
                  Select Job Description File
                </n-button>
              </n-upload>
              <div class="upload-hint">
                Supported formats: PDF, DOCX, TXT, Markdown (Max 10MB)
              </div>
            </n-form-item>

            <n-form-item label="Cultural Fit Document (Optional)" path="cultural_fit_file">
              <n-upload
                ref="culturalFitUploadRef"
                :max="1"
                :default-upload="false"
                @change="handleCulturalFitFileChange"
                accept=".pdf,.docx,.txt,.md"
              >
                <n-button>
                  <template #icon>
                    <i class="fas fa-upload"></i>
                  </template>
                  Select Cultural Fit Document
                </n-button>
              </n-upload>
              <div class="upload-hint">
                Optional: Company culture, values, or additional requirements
              </div>
            </n-form-item>

            <div class="form-actions">
              <n-button @click="handleCancel">Cancel</n-button>
              <n-button
                type="primary"
                :loading="submitting"
                @click="handleSubmit"
              >
                Create Project
              </n-button>
            </div>
          </n-form>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NSelect, NUpload, NButton, useMessage } from 'naive-ui'
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import { config } from '@/config'
import api from '@/utils/api'
import { createNormalizedFile } from '@/utils/fileHelpers'

const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const jdUploadRef = ref<any>(null)
const culturalFitUploadRef = ref<any>(null)

interface FormData {
  project_name: string
  company: string
  position_category: string
  position_title: string
  description: string
  jd_file: File | null
  cultural_fit_file: File | null
}

const formData = ref<FormData>({
  project_name: '',
  company: '',
  position_category: '',
  position_title: '',
  description: '',
  jd_file: null,
  cultural_fit_file: null
})

const positionCategoryOptions = ref<Array<{label: string, value: string}>>([])
const submitting = ref(false)

const rules: FormRules = {
  project_name: [
    { required: true, message: 'Project name is required', trigger: 'blur' }
  ],
  company: [
    { required: true, message: 'Company name is required', trigger: 'blur' }
  ],
  position_category: [
    { required: true, message: 'Position category is required', trigger: 'change' }
  ],
  position_title: [
    { required: true, message: 'Position title is required', trigger: 'blur' }
  ]
}

function handleJDFileChange(data: { fileList: UploadFileInfo[] }) {
  if (data.fileList.length > 0) {
    formData.value.jd_file = data.fileList[0].file as File
  } else {
    formData.value.jd_file = null
  }
}

function handleCulturalFitFileChange(data: { fileList: UploadFileInfo[] }) {
  if (data.fileList.length > 0) {
    formData.value.cultural_fit_file = data.fileList[0].file as File
  } else {
    formData.value.cultural_fit_file = null
  }
}

function handleCancel() {
  router.push('/projects')
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (!formData.value.jd_file) {
      message.error('Job description file is required')
      return
    }

    submitting.value = true

    const formPayload = new FormData()
    formPayload.append('project_name', formData.value.project_name)
    formPayload.append('company', formData.value.company)
    formPayload.append('position_category', formData.value.position_category)
    formPayload.append('position_title', formData.value.position_title)
    formPayload.append('description', formData.value.description)
    formPayload.append('jd_file', createNormalizedFile(formData.value.jd_file!))
    
    if (formData.value.cultural_fit_file) {
      formPayload.append('cultural_fit_file', createNormalizedFile(formData.value.cultural_fit_file))
    }

    const response = await api.post(`${config.talentApiUrl}/projects/create`, formPayload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = response.data

    if (data.success && data.task_id) {
      message.success('Project creation started. Processing job description...')
      router.push(`/create-project-waiting/${data.task_id}`)
    } else {
      throw new Error(data.message || 'Failed to create project')
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('validation')) {
      console.error('Error creating project:', err)
      message.error(err.message || 'Failed to create project')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // Load position categories
  try {
    const response = await fetch('/position_category.json')
    if (response.ok) {
      const categories = await response.json()
      positionCategoryOptions.value = Object.keys(categories).map(key => ({
        label: key,
        value: key
      }))
    }
  } catch (err) {
    console.error('Failed to load position categories:', err)
    // Fallback categories
    positionCategoryOptions.value = [
      { label: 'Software and Engineering', value: 'Software and Engineering' },
      { label: 'Data and Analytics', value: 'Data and Analytics' },
      { label: 'Product and Project Management', value: 'Product and Project Management' },
      { label: 'Design and Creative', value: 'Design and Creative' },
      { label: 'Sales and Business Development', value: 'Sales and Business Development' },
      { label: 'Marketing and Communications', value: 'Marketing and Communications' },
      { label: 'Human Resources', value: 'Human Resources' },
      { label: 'Finance and Accounting', value: 'Finance and Accounting' },
      { label: 'Operations and Supply Chain', value: 'Operations and Supply Chain' },
      { label: 'Other', value: 'Other' }
    ]
  }
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  padding: 0.67rem;
  overflow-y: auto;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.upload-hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .form-card {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>

