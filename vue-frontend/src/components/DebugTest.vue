<template>
  <div class="min-h-screen bg-blue-900 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Debug Test Route</h1>
      <p class="text-gray-600">If you can see this, the routing system is working!</p>
      <div class="mt-4">
        <router-link to="/" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Go Home
        </router-link>
        <router-link to="/valt" class="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Try VALT Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple debug component
</script>