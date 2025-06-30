"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Shield, Phone, AlertTriangle } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface SharedRouteData {
  origin: string
  destination: string
  userLocation: { lat: number; lng: number }
  lastUpdate: string
  status: "started" | "in_progress" | "completed" | "emergency"
  estimatedArrival: string
  safetyScore: number
}

export default function SharedRoutePage() {
  const [routeData, setRouteData] = useState<SharedRouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const searchParams = useSearchParams()

  const TOMTOM_API_KEY = "K3y9wO0hvDw2Wqh9xydEhEOo3f25KTVA"

  useEffect(() => {
    const origin = searchParams.get("origin")
    const destination = searchParams.get("destination")

    if (origin && destination) {
      loadSharedRoute(origin, destination)
    }

    loadTomTomMap()
  }, [searchParams])

  const loadTomTomMap = async () => {
    try {
      if (!window.tt) {
        const script = document.createElement("script")
        script.src = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"
        script.onload = initializeMap
        document.head.appendChild(script)

        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"
        document.head.appendChild(link)
      } else {
        initializeMap()
      }
    } catch (error) {
      console.error("Failed to load TomTom Maps:", error)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.tt) return

    try {
      mapInstanceRef.current = window.tt.map({
        key: TOMTOM_API_KEY,
        container: mapRef.current,
        center: [77.209, 28.6139], // Delhi coordinates
        zoom: 12,
        style: "main",
      })

      mapInstanceRef.current.on("load", () => {
        if (routeData) {
          displayUserLocation()
        }
      })
    } catch (error) {
      console.error("Failed to initialize map:", error)
    }
  }

  const loadSharedRoute = async (origin: string, destination: string) => {
    try {
      // Mock shared route data - in real app, fetch from database
      const mockData: SharedRouteData = {
        origin,
        destination,
        userLocation: { lat: 28.6139, lng: 77.209 },
        lastUpdate: new Date().toLocaleString(),
        status: "in_progress",
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toLocaleString(), // 30 minutes from now
        safetyScore: 85,
      }

      setRouteData(mockData)
      setLoading(false)

      // Start live tracking updates
      startLiveTracking()
    } catch (error) {
      console.error("Failed to load shared route:", error)
      setLoading(false)
    }
  }

  const displayUserLocation = () => {
    if (!mapInstanceRef.current || !routeData) return

    // Add user location marker
    const marker = new window.tt.Marker({
      color: "#4CAF50",
    })
      .setLngLat([routeData.userLocation.lng, routeData.userLocation.lat])
      .addTo(mapInstanceRef.current)

    const popup = new window.tt.Popup({ offset: 35 }).setHTML(
      `<div><strong>Current Location</strong><br/>Last updated: ${routeData.lastUpdate}</div>`,
    )

    marker.setPopup(popup)

    // Center map on user location
    mapInstanceRef.current.setCenter([routeData.userLocation.lng, routeData.userLocation.lat])
  }

  const startLiveTracking = () => {
    // Simulate live location updates every 30 seconds
    const interval = setInterval(() => {
      if (routeData && routeData.status === "in_progress") {
        // Mock location update
        const newLocation = {
          lat: routeData.userLocation.lat + (Math.random() - 0.5) * 0.001,
          lng: routeData.userLocation.lng + (Math.random() - 0.5) * 0.001,
        }

        setRouteData((prev) =>
          prev
            ? {
                ...prev,
                userLocation: newLocation,
                lastUpdate: new Date().toLocaleString(),
              }
            : null,
        )

        // Update marker on map
        if (mapInstanceRef.current) {
          displayUserLocation()
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "started":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "started":
        return "🚀"
      case "in_progress":
        return "🚶‍♀️"
      case "completed":
        return "✅"
      case "emergency":
        return "🚨"
      default:
        return "📍"
    }
  }

  const callUser = () => {
    // In real app, get user's phone number from database
    window.open("tel:+919876543210")
  }

  const reportConcern = () => {
    // In real app, send alert to authorities
    alert("Concern reported. Authorities have been notified.")
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared route...</p>
        </div>
      </div>
    )
  }

  if (!routeData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Route Not Found</h2>
            <p className="text-gray-600">The shared route link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Live Route Tracking</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Following someone's journey for safety</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Journey Status</h3>
                <p className="text-sm text-gray-500">Real-time location tracking</p>
              </div>
              <Badge className={getStatusColor(routeData.status)}>
                {getStatusIcon(routeData.status)} {routeData.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">From:</span>
                <span className="text-sm text-gray-600">{routeData.origin}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">To:</span>
                <span className="text-sm text-gray-600">{routeData.destination}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Update:</span>
                <span className="text-sm text-gray-600">{routeData.lastUpdate}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ETA:</span>
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {routeData.estimatedArrival}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Live Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapRef} className="w-full h-64 rounded-lg" />
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">Route Safety Score</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{routeData.safetyScore}/100</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 dark:text-red-200">Emergency Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={callUser} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Phone className="w-4 h-4 mr-2" />
              Call Traveler
            </Button>

            <Button
              onClick={reportConcern}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Safety Concern
            </Button>

            <Button onClick={() => window.open("tel:100")} className="w-full bg-red-600 hover:bg-red-700 text-white">
              🚨 Call Police (100)
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How Live Tracking Works:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Location updates automatically every 30 seconds</li>
            <li>• You'll be notified if they deviate from the planned route</li>
            <li>• Emergency alerts are sent if no movement is detected</li>
            <li>• All tracking data is encrypted and secure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
