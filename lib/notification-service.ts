// Notification service for emergency alerts and live tracking

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class NotificationService {
  private isSupported = false
  private permission: NotificationPermission = "default"

  constructor() {
    if (typeof window !== "undefined") {
      this.isSupported = "Notification" in window
      this.permission = this.isSupported ? Notification.permission : "denied"
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn("Notifications not supported")
      return false
    }

    if (this.permission === "granted") {
      return true
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.permission !== "granted") {
      console.warn("Cannot show notification - permission not granted")
      return
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icon-192x192.png",
        badge: options.badge || "/icon-192x192.png",
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: false,
      })

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 10000)
      }

      return new Promise((resolve) => {
        notification.onshow = () => resolve()
        notification.onerror = () => resolve()
      })
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }

  async showEmergencyNotification(location: string): Promise<void> {
    await this.showNotification({
      title: "🚨 Emergency Alert Sent",
      body: `Emergency contacts notified. Location: ${location}`,
      requireInteraction: true,
      tag: "emergency",
      actions: [
        { action: "call-police", title: "Call Police" },
        { action: "view-location", title: "View Location" },
      ],
    })
  }

  async showLocationUpdateNotification(location: string): Promise<void> {
    await this.showNotification({
      title: "📍 Location Shared",
      body: `Your location has been shared: ${location}`,
      tag: "location-update",
    })
  }

  async showSafetyAlertNotification(message: string): Promise<void> {
    await this.showNotification({
      title: "⚠️ Safety Alert",
      body: message,
      requireInteraction: true,
      tag: "safety-alert",
    })
  }

  // Vibrate device (if supported)
  vibrate(pattern: number | number[] = [200, 100, 200]): void {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  }

  // Play emergency sound
  playEmergencySound(): void {
    try {
      // Create audio context for emergency sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create oscillator for emergency tone
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)

      // Repeat 3 times
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.setValueAtTime(600, audioContext.currentTime)
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        osc2.start()
        osc2.stop(audioContext.currentTime + 0.5)
      }, 600)

      setTimeout(() => {
        const osc3 = audioContext.createOscillator()
        const gain3 = audioContext.createGain()
        osc3.connect(gain3)
        gain3.connect(audioContext.destination)
        osc3.frequency.setValueAtTime(1000, audioContext.currentTime)
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime)
        osc3.start()
        osc3.stop(audioContext.currentTime + 0.5)
      }, 1200)
    } catch (error) {
      console.error("Error playing emergency sound:", error)
    }
  }
}

export const notificationService = new NotificationService()

// Auto-request permission on app load
if (typeof window !== "undefined") {
  notificationService.requestPermission()
}
