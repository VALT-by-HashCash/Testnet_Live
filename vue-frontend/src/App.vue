<template>
  <router-view />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const signedIn = ref(false)
const user = ref(null)

// Load local user on app mount (fallback)
onMounted(() => {
  try {
    const raw = localStorage.getItem('breadcrumbs_user')
    if (raw) {
      user.value = JSON.parse(raw)
      signedIn.value = true
    }
  } catch (e) { /* ignore */ }

  // global listener for verification/login actions
  window.addEventListener('breadcrumbs-auth-change', (ev) => {
    const d = ev.detail || {}
    if (d.isAuthenticated) {
      user.value = d.user || user.value
      signedIn.value = true
      // persist
      try { localStorage.setItem('breadcrumbs_user', JSON.stringify(user.value)) } catch {}
    } else {
      user.value = null
      signedIn.value = false
      try { localStorage.removeItem('breadcrumbs_user') } catch {}
    }
  })
})
</script>

<style>
/* Base reset - Tailwind will handle the rest */
html, body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

#app {
  min-height: 100vh;
}
</style>