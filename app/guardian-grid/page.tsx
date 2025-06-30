"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, AlertTriangle, Map, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GuardianStatus {
  isActive: boolean
  currentTile: string
  status: "monitoring" | "idle" | "suspicious" | "alert"
  nearbyGuardians: number
  lastUpdate: string
}

interface BehaviorAlert {
  id: string
  type: "motion" | "audio" | "loitering" | "keyword"
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  description: string
  location: { lat: number; lng: number }
  autoActions: string[]
}

export default function GuardianGridPage() {
  const [guardianStatus, setGuardianStatus] = useState<GuardianStatus>({
    isActive: false,
    currentTile: "",
    status: "idle",
    nearbyGuardians: 0,
    lastUpdate: "",
  })

  const [settings, setSettings] = useState({
    voiceDeterrent: true,
    autoFlash: true,
    anonymousMode: false,
    audioRecording: true,
    communityAlerts: true,
  })

  const [currentAlert, setCurrentAlert] = useState<BehaviorAlert | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [motionLevel, setMotionLevel] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (guardianStatus.isActive) {
      startGuardianGrid()
    } else {
      stopGuardianGrid()
    }

    return () => stopGuardianGrid()
  }, [guardianStatus.isActive])

  const startGuardianGrid = async () => {
    try {
      // Get current location
      const position = await getCurrentPosition()
      setLocation(position)

      // Generate GPS tile code
      const tileCode = generateTileCode(position.lat, position.lng)

      // Activate Guardian Grid
      await fetch("/api/guardian/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: position,
          tileCode,
          settings,
        }),
      })

      // Start monitoring systems
      await startAudioMonitoring()
      startMotionDetection()
      startLocationTracking()

      setGuardianStatus((prev) => ({
        ...prev,
        currentTile: tileCode,
        status: "monitoring",
        lastUpdate: new Date().toLocaleString(),
      }))

      // Fetch nearby guardians
      fetchNearbyGuardians()

      toast({
        title: "Guardian Grid Activated",
        description: `Monitoring tile ${tileCode}. You are now protected by the Guardian Grid.`,
      })
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Please allow location and microphone access to activate Guardian Grid.",
        variant: "destructive",
      })
      setGuardianStatus((prev) => ({ ...prev, isActive: false }))
    }
  }

  const stopGuardianGrid = () => {
    setIsListening(false)
    setGuardianStatus((prev) => ({ ...prev, status: "idle" }))

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
  }

  const getCurrentPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true },
      )
    })
  }

  const generateTileCode = (lat: number, lng: number): string => {
    // Generate 6-character tile code based on GPS coordinates
    const latCode = Math.floor((lat + 90) * 1000)
      .toString(36)
      .slice(-3)
      .toUpperCase()
    const lngCode = Math.floor((lng + 180) * 1000)
      .toString(36)
      .slice(-3)
      .toUpperCase()
    return latCode + lngCode
  }

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContextRef.current = new AudioContext()
      const analyser = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)

      mediaRecorderRef.current = new MediaRecorder(stream)
      setIsListening(true)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkAudio = () => {
        if (!guardianStatus.isActive) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)

        // Detect suspicious audio patterns
        if (average > 120) {
          handleBehaviorDetection("audio", "high", "High audio level detected - possible distress")
        }

        // Check for keywords (mock implementation)
        if (Math.random() < 0.001) {
          // Simulate keyword detection
          handleBehaviorDetection("keyword", "critical", "Distress keyword detected")
        }

        requestAnimationFrame(checkAudio)
      }

      checkAudio()
    } catch (error) {
      console.error("Audio monitoring failed:", error)
    }
  }

  const startMotionDetection = () => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        if (!guardianStatus.isActive) return

        const acceleration = event.accelerationIncludingGravity
        if (acceleration) {
          const totalAcceleration = Math.sqrt(
            (acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2,
          )

          setMotionLevel(totalAcceleration)

          // Detect suspicious motion patterns
          if (totalAcceleration > 30) {
            handleBehaviorDetection("motion", "high", "Sudden violent movement detected")
          }
        }
      }

      window.addEventListener("devicemotion", handleMotion)
      return () => window.removeEventListener("devicemotion", handleMotion)
    }
  }

  const startLocationTracking = () => {
    const trackLocation = () => {
      if (!guardianStatus.isActive) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          // Check for loitering (staying in same area too long)
          if (location) {
            const distance = calculateDistance(location, newLocation)
            if (distance < 0.01) {
              // Less than 10 meters movement
              // Could indicate loitering - implement logic here
            }
          }

          setLocation(newLocation)
        },
        (error) => console.error("Location tracking error:", error),
      )
    }

    const interval = setInterval(trackLocation, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }

  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleBehaviorDetection = async (
    type: "motion" | "audio" | "loitering" | "keyword",
    severity: "low" | "medium" | "high" | "critical",
    description: string,
  ) => {
    const alert: BehaviorAlert = {
      id: Date.now().toString(),
      type,
      severity,
      timestamp: new Date().toISOString(),
      description,
      location: location!,
      autoActions: [],
    }

    // Determine auto-actions based on severity
    if (severity === "high" || severity === "critical") {
      if (settings.voiceDeterrent) {
        alert.autoActions.push("Voice Deterrent Activated")
        playVoiceDeterrent()
      }

      if (settings.autoFlash) {
        alert.autoActions.push("Emergency Flash Activated")
        activateFlash()
      }

      if (settings.audioRecording) {
        alert.autoActions.push("Audio Recording Started")
        startEmergencyRecording()
      }
    }

    setCurrentAlert(alert)
    setGuardianStatus((prev) => ({ ...prev, status: "suspicious" }))

    // Send to backend
    await fetch("/api/guardian/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...alert,
        tileCode: guardianStatus.currentTile,
        settings,
      }),
    })

    // Alert nearby guardians if critical
    if (severity === "critical" && settings.communityAlerts) {
      await alertNearbyGuardians(alert)
    }
  }

  const playVoiceDeterrent = () => {
    const utterance = new SpeechSynthesisUtterance(
      "Warning! This area is being monitored. Inappropriate behavior has been detected. Authorities have been notified.",
    )
    utterance.volume = 1
    utterance.rate = 1
    speechSynthesis.speak(utterance)
  }

  const activateFlash = () => {
    // Flash screen and try to activate camera flash
    let flashCount = 0
    const flashInterval = setInterval(() => {
      document.body.style.backgroundColor = flashCount % 2 === 0 ? "#ff0000" : "#ffffff"
      flashCount++

      if (flashCount >= 10) {
        clearInterval(flashInterval)
        document.body.style.backgroundColor = ""
      }
    }, 200)
  }

  const startEmergencyRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      const chunks: BlobPart[] = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" })
        await uploadEmergencyAudio(audioBlob)
      }

      mediaRecorderRef.current.start()
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop()
        }
      }, 30000) // Record for 30 seconds
    }
  }

  const uploadEmergencyAudio = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append("audio", audioBlob, "emergency-recording.wav")
    formData.append("tileCode", guardianStatus.currentTile)
    formData.append("timestamp", new Date().toISOString())

    try {
      await fetch("/api/guardian/audio-upload", {
        method: "POST",
        body: formData,
      })
    } catch (error) {
      console.error("Failed to upload emergency audio:", error)
    }
  }

  const fetchNearbyGuardians = async () => {
    try {
      const response = await fetch("/api/guardian/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuardianStatus((prev) => ({
          ...prev,
          nearbyGuardians: data.guardians.length,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch nearby guardians:", error)
    }
  }

  const alertNearbyGuardians = async (alert: BehaviorAlert) => {
    try {
      await fetch("/api/guardian/alert-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert,
          location,
          tileCode: guardianStatus.currentTile,
        }),
      })

      toast({
        title: "Community Alerted",
        description: "Nearby guardians have been notified of the situation.",
      })
    } catch (error) {
      console.error("Failed to alert community:", error)
    }
  }

  const dismissAlert = () => {
    setCurrentAlert(null)
    setGuardianStatus((prev) => ({ ...prev, status: "monitoring" }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "monitoring":
        return "text-green-600 bg-green-100"
      case "suspicious":
        return "text-yellow-600 bg-yellow-100"
      case "alert":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "monitoring":
        return "🛡️"
      case "suspicious":
        return "⚠️"
      case "alert":
        return "🚨"
      default:
        return "⭕"
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Guardian Grid</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">AI-powered prevention network</p>
        </div>

        {/* Current Alert */}
        {currentAlert && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-red-800">Behavior Alert:</strong>
                  <p className="text-sm text-red-700 mt-1">{currentAlert.description}</p>
                  {currentAlert.autoActions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600">Auto-actions taken:</p>
                      <ul className="text-xs text-red-600">
                        {currentAlert.autoActions.map((action, index) => (
                          <li key={index}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={dismissAlert}>
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Control */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Guardian Grid</h3>
                <p className="text-sm text-gray-500">Real-time protection network</p>
              </div>
              <Switch
                checked={guardianStatus.isActive}
                onCheckedChange={(checked) => setGuardianStatus((prev) => ({ ...prev, isActive: checked }))}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {guardianStatus.isActive && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(guardianStatus.status)}>
                    {getStatusIcon(guardianStatus.status)} {guardianStatus.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Current Tile */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GPS Tile:</span>
                  <Badge variant="outline" className="font-mono">
                    {guardianStatus.currentTile}
                  </Badge>
                </div>

                {/* Nearby Guardians */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nearby Guardians:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Users className="w-3 h-3 mr-1" />
                    {guardianStatus.nearbyGuardians}
                  </Badge>
                </div>

                {/* Monitoring Levels */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Audio Level:</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(audioLevel / 2, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Motion Level:</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(motionLevel * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 bg-transparent"
            onClick={() => (window.location.href = "/guardian-grid/nearby")}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Nearby Guardians</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 bg-transparent"
            onClick={() => (window.location.href = "/guardian-grid/heatmap")}
          >
            <Map className="w-6 h-6" />
            <span className="text-xs">Safety Heatmap</span>
          </Button>
        </div>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2" />
              Guardian Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Voice Deterrent</div>
                <div className="text-xs text-gray-500">Play warning message when threat detected</div>
              </div>
              <Switch
                checked={settings.voiceDeterrent}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, voiceDeterrent: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Auto Flash/Siren</div>
                <div className="text-xs text-gray-500">Activate emergency signals automatically</div>
              </div>
              <Switch
                checked={settings.autoFlash}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoFlash: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Anonymous Mode</div>
                <div className="text-xs text-gray-500">Hide identity from other guardians</div>
              </div>
              <Switch
                checked={settings.anonymousMode}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, anonymousMode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Audio Recording</div>
                <div className="text-xs text-gray-500">Record evidence during incidents</div>
              </div>
              <Switch
                checked={settings.audioRecording}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, audioRecording: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Community Alerts</div>
                <div className="text-xs text-gray-500">Alert nearby guardians during emergencies</div>
              </div>
              <Switch
                checked={settings.communityAlerts}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, communityAlerts: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🔒 Privacy & Security</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• All data is encrypted and stored securely</li>
            <li>• Location data is anonymized in community features</li>
            <li>• Audio recordings are only saved during incidents</li>
            <li>• You can opt out of Guardian Grid at any time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
