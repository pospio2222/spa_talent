import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const username = ref('User')
  const loading = ref(true)

  const setAuth = (logged: boolean, user: string) => {
    isLoggedIn.value = logged
    username.value = user
    loading.value = false
  }

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  return {
    isLoggedIn,
    username,
    loading,
    setAuth,
    setLoading
  }
})

