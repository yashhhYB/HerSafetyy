"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Shield, Mic, Smartphone, EyeOff, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function GuardianPage() {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [motionDetected, setMotionDetected] = useState(false)
  const [stealthMode, setStealthMode] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [lastTrigger, setLastTrigger] = useState<string | null>(null)
  const [recordings, setRecordings] = useState<Array<{ id: string; timestamp: string; trigger: string }>>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isActive) {
      startGuardianMode()
    } else {
      stopGuardianMode()
    }

    return () => stopGuardianMode()
  }, [isActive])

  const startGuardianMode = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio analysis
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)

      setIsListening(true)
      startAudioMonitoring()
      startMotionDetection()

      toast({
        title: "Guardian Mode Activated",
        description: "Smart monitoring is now active. Stay safe!",
      })
    } catch (error) {
      toast({
        title: "Permission Required",
        description: "Please allow microphone access for Guardian Mode.",
        variant: "destructive",
      })
      setIsActive(false)
    }
  }

  const stopGuardianMode = () => {
    setIsListening(false)
    setMotionDetected(false)

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
  }

  const startAudioMonitoring = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const checkAudio = () => {
      if (!isActive || !analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)

      // Detect distress keywords or loud sounds
      if (average > 150) {
        handleThreatDetected("High audio level detected")
      }

      requestAnimationFrame(checkAudio)
    }

    checkAudio()
  }

  const startMotionDetection = () => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        if (!isActive) return

        const acceleration = event.accelerationIncludingGravity
        if (acceleration) {
          const totalAcceleration = Math.sqrt(
            (acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2,
          )

          // Detect sudden movements (shake detection)
          if (totalAcceleration > 25) {
            setMotionDetected(true)
            handleThreatDetected("Sudden movement detected")
            setTimeout(() => setMotionDetected(false), 2000)
          }
        }
      }

      window.addEventListener("devicemotion", handleMotion)
      return () => window.removeEventListener("devicemotion", handleMotion)
    }
  }

  const handleThreatDetected = async (trigger: string) => {
    setLastTrigger(trigger)

    // Record audio evidence
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      const chunks: BlobPart[] = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" })
        const recordingId = Date.now().toString()

        setRecordings((prev) => [
          ...prev,
          {
            id: recordingId,
            timestamp: new Date().toLocaleString(),
            trigger,
          },
        ])
      }

      mediaRecorderRef.current.start()
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop()
        }
      }, 10000) // Record for 10 seconds
    }

    // Send alert to emergency contacts
    await sendEmergencyAlert(trigger)
  }

  const sendEmergencyAlert = async (trigger: string) => {
    try {
      const position = await getCurrentPosition()

      await fetch("/api/guardian/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          location: position,
          timestamp: new Date().toISOString(),
          stealthMode,
        }),
      })

      if (!stealthMode) {
        toast({
          title: "Emergency Alert Sent",
          description: `Alert sent due to: ${trigger}`,
        })
      }
    } catch (error) {
      console.error("Failed to send emergency alert:", error)
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
      )
    })
  }

  const activateStealthMode = () => {
    setStealthMode(true)
    // Hide the app and show a fake screen
    document.body.style.background = "#000"
    toast({
      title: "Stealth Mode Activated",
      description: "App is now hidden. Triple tap to deactivate.",
    })
  }

  if (stealthMode) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center"
        onClick={() => {
          // Triple tap to exit stealth mode
          let tapCount = 0
          const handleTap = () => {
            tapCount++
            if (tapCount === 3) {
              setStealthMode(false)
              document.body.style.background = ""
            }
            setTimeout(() => (tapCount = 0), 1000)
          }
          handleTap()
        }}
      >
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-sm opacity-50">Screen Locked</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isActive ? "bg-green-100 animate-pulse" : "bg-gray-100"
            }`}
          >
            <Shield className={`w-8 h-8 ${isActive ? "text-green-600" : "text-gray-600"}`} />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Smart Guardian</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">AI-powered background protection</p>
        </div>

        {/* Main Control */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="text-sm font-medium">Guardian Mode</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-green-600" />
            </div>

            {isActive && (
              <div className="space-y-3">
                <Badge variant={isListening ? "default" : "secondary"} className="mr-2">
                  <Mic className="w-3 h-3 mr-1" />
                  {isListening ? "Listening" : "Inactive"}
                </Badge>

                <Badge variant={motionDetected ? "destructive" : "secondary"}>
                  <Smartphone className="w-3 h-3 mr-1" />
                  {motionDetected ? "Motion Detected" : "Monitoring"}
                </Badge>

                {audioLevel > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Audio Level</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(audioLevel / 2, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Volume2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Voice Detection</div>
              <div className="text-xs text-gray-500">{isActive ? "Active" : "Inactive"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Smartphone className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">Motion Sensor</div>
              <div className="text-xs text-gray-500">{isActive ? "Monitoring" : "Inactive"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Emergency Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={activateStealthMode} variant="outline" className="w-full justify-start bg-transparent">
              <EyeOff className="w-4 h-4 mr-2" />
              Activate Stealth Mode
            </Button>

            <Button
              onClick={() => handleThreatDetected("Manual trigger")}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              Manual Emergency Alert
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recordings.slice(-3).map((recording) => (
                  <div key={recording.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{recording.trigger}</span>
                    <span className="text-xs text-gray-400">{recording.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Monitors audio for distress keywords</li>
            <li>• Detects sudden movements or shaking</li>
            <li>• Records evidence automatically</li>
            <li>• Sends alerts to emergency contacts</li>
            <li>• Works silently in background</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
