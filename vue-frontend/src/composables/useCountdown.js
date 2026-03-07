import { ref, computed, onUnmounted } from 'vue'

export function useCountdown() {
  const countdown = ref(0)
  const rewardClaimed = ref(false)

  const timeLeft = computed(() => {
    const secs = Math.max(0, countdown.value || 0)
    return {
      hours: Math.floor(secs / 3600),
      minutes: Math.floor((secs % 3600) / 60),
      seconds: secs % 60
    }
  })

  let countdownTimer = null

  function startTimer() {
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value--
      } else if (rewardClaimed.value) {
        rewardClaimed.value = false
      }
    }, 1000)
  }

  function stopTimer() {
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = null
  }

  onUnmounted(() => {
    stopTimer()
  })

  return { countdown, rewardClaimed, timeLeft, startTimer, stopTimer }
}
