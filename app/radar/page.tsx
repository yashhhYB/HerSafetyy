"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin, Clock, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ThreatAlert {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  location: { lat: number; lng: number; address: string }
  timestamp: string
  distance: number
  type: string
  verified: boolean
}

export default function RadarPage() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "nearby" | "high">("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    getCurrentLocation()
    fetchThreatAlerts()

    // Set up real-time updates
    const interval = setInterval(fetchThreatAlerts, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const fetchThreatAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/radar/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: userLocation }),
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error("Failed to fetch threat alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨"
      case "high":
        return "⚠️"
      case "medium":
        return "⚡"
      case "low":
        return "ℹ️"
      default:
        return "📍"
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    switch (filter) {
      case "nearby":
        return alert.distance <= 2
      case "high":
        return ["high", "critical"].includes(alert.severity)
      default:
        return true
    }
  })

  const shareLocation = async (alertId: string) => {
    try {
      if (!userLocation) {
        toast({
          title: "Location Required",
          description: "Please enable location services to share your location.",
          variant: "destructive",
        })
        return
      }

      await fetch("/api/location/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: userLocation,
          alertId,
          timestamp: new Date().toISOString(),
        }),
      })

      toast({
        title: "Location Shared",
        description: "Your location has been shared with emergency contacts and authorities.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share location. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Live Threat Radar</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Real-time safety alerts in your area</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All
            </Button>
            <Button variant={filter === "nearby" ? "default" : "outline"} size="sm" onClick={() => setFilter("nearby")}>
              Nearby
            </Button>
            <Button variant={filter === "high" ? "default" : "outline"} size="sm" onClick={() => setFilter("high")}>
              High Risk
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchThreatAlerts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter((a) => a.severity === "critical").length}
              </div>
              <div className="text-xs text-gray-500">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{alerts.filter((a) => a.distance <= 2).length}</div>
              <div className="text-xs text-gray-500">Nearby</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🛡️</div>
                <p className="text-gray-600 dark:text-gray-300">
                  {filter === "all" ? "No active threats in your area" : "No alerts match your filter"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === "critical"
                    ? "border-l-red-500"
                    : alert.severity === "high"
                      ? "border-l-orange-500"
                      : alert.severity === "medium"
                        ? "border-l-yellow-500"
                        : "border-l-blue-500"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                      <div>
                        <CardTitle className="text-sm">{alert.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          {alert.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{alert.description}</p>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {alert.location.address} ({alert.distance.toFixed(1)} km away)
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => shareLocation(alert.id)} className="flex-1">
                      Share My Location
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Emergency Actions */}
        <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">Feel Unsafe? Take Action Now</h3>
            <div className="space-y-2">
              <Button className="w-full coral-gradient text-white" onClick={() => shareLocation("emergency")}>
                Share Location with Police
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => (window.location.href = "/sos")}
              >
                Send Emergency Alert
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Safety Tips:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Stay in well-lit, populated areas</li>
            <li>• Trust your instincts if something feels wrong</li>
            <li>• Keep your phone charged and accessible</li>
            <li>• Share your location with trusted contacts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
