"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Navigation, AlertTriangle, Shield, Clock, Route, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RouteData {
  distance: string
  duration: string
  safetyScore: number
  warnings: string[]
  waypoints: Array<{ lat: number; lng: number; name: string }>
  instructions: string[]
  avoidedAreas: string[]
}

interface LocationSuggestion {
  id: string
  address: string
  position: { lat: number; lng: number }
  type: string
}

export default function SafeRoutePage() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>([])

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const { toast } = useToast()

  // TomTom API Key
  const TOMTOM_API_KEY = "K3y9wO0hvDw2Wqh9xydEhEOo3f25KTVA"

  useEffect(() => {
    getCurrentLocation()
    loadTomTomMap()
  }, [])

  const loadTomTomMap = async () => {
    try {
      // Load TomTom Maps SDK
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
        setMapLoaded(true)
        if (currentLocation) {
          addCurrentLocationMarker()
        }
      })
    } catch (error) {
      console.error("Failed to initialize map:", error)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(location)
          setOrigin("Current Location")

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter([location.lng, location.lat])
            addCurrentLocationMarker()
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to Delhi if location access denied
          const defaultLocation = { lat: 28.6139, lng: 77.209 }
          setCurrentLocation(defaultLocation)
        },
      )
    }
  }

  const addCurrentLocationMarker = () => {
    if (!mapInstanceRef.current || !currentLocation) return

    const marker = new window.tt.Marker({
      color: "#4CAF50",
    })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(mapInstanceRef.current)

    const popup = new window.tt.Popup({ offset: 35 }).setHTML("<div><strong>Your Location</strong></div>")

    marker.setPopup(popup)
  }

  const searchLocations = async (query: string, isDestination = false) => {
    if (query.length < 3) {
      if (isDestination) {
        setDestinationSuggestions([])
        setShowDestinationSuggestions(false)
      } else {
        setOriginSuggestions([])
        setShowOriginSuggestions(false)
      }
      return
    }

    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&countrySet=IN&limit=5`,
      )

      if (response.ok) {
        const data = await response.json()
        const suggestions: LocationSuggestion[] = data.results.map((result: any) => ({
          id: result.id,
          address: result.address.freeformAddress,
          position: {
            lat: result.position.lat,
            lng: result.position.lon,
          },
          type: result.type,
        }))

        if (isDestination) {
          setDestinationSuggestions(suggestions)
          setShowDestinationSuggestions(true)
        } else {
          setOriginSuggestions(suggestions)
          setShowOriginSuggestions(true)
        }
      }
    } catch (error) {
      console.error("Error searching locations:", error)
    }
  }

  const selectLocation = (suggestion: LocationSuggestion, isDestination = false) => {
    if (isDestination) {
      setDestination(suggestion.address)
      setShowDestinationSuggestions(false)
    } else {
      setOrigin(suggestion.address)
      setShowOriginSuggestions(false)
    }

    // Add marker to map
    if (mapInstanceRef.current) {
      const marker = new window.tt.Marker({
        color: isDestination ? "#FF5252" : "#2196F3",
      })
        .setLngLat([suggestion.position.lng, suggestion.position.lat])
        .addTo(mapInstanceRef.current)

      const popup = new window.tt.Popup({ offset: 35 }).setHTML(
        `<div><strong>${isDestination ? "Destination" : "Origin"}</strong><br/>${suggestion.address}</div>`,
      )

      marker.setPopup(popup)
    }
  }

  const findSafeRoute = async () => {
    if (!destination.trim()) {
      toast({
        title: "Error",
        description: "Please enter a destination",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Get coordinates for origin and destination
      const originCoords = origin === "Current Location" ? currentLocation : await geocodeAddress(origin)
      const destCoords = await geocodeAddress(destination)

      if (!originCoords || !destCoords) {
        throw new Error("Could not find coordinates for the specified locations")
      }

      // Calculate route using TomTom Routing API
      const routeResponse = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${originCoords.lat},${originCoords.lng}:${destCoords.lat},${destCoords.lng}/json?key=${TOMTOM_API_KEY}&routeType=fastest&avoid=unpavedRoads&instructionsType=text`,
      )

      if (!routeResponse.ok) {
        throw new Error("Failed to calculate route")
      }

      const routeData = await routeResponse.json()
      const route = routeData.routes[0]

      // Analyze route for safety
      const safetyAnalysis = await analyzeSafety(route, originCoords, destCoords)

      const processedRoute: RouteData = {
        distance: formatDistance(route.summary.lengthInMeters),
        duration: formatDuration(route.summary.travelTimeInSeconds),
        safetyScore: safetyAnalysis.score,
        warnings: safetyAnalysis.warnings,
        waypoints: route.legs[0].points.map((point: any, index: number) => ({
          lat: point.latitude,
          lng: point.longitude,
          name: `Point ${index + 1}`,
        })),
        instructions: route.guidance.instructions.map((instruction: any) => instruction.message),
        avoidedAreas: safetyAnalysis.avoidedAreas,
      }

      setRoute(processedRoute)

      // Display route on map
      displayRouteOnMap(route)

      toast({
        title: "Safe Route Found",
        description: `Route calculated with safety score: ${safetyAnalysis.score}/100`,
      })
    } catch (error) {
      console.error("Route calculation error:", error)
      toast({
        title: "Error",
        description: "Failed to find safe route. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}&countrySet=IN`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.results.length > 0) {
          const result = data.results[0]
          return {
            lat: result.position.lat,
            lng: result.position.lon,
          }
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
    return null
  }

  const analyzeSafety = async (
    route: any,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) => {
    // Call our safety analysis API
    const response = await fetch("/api/route/safety-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: route.legs[0].points,
        origin,
        destination,
        timeOfDay: new Date().getHours(),
      }),
    })

    if (response.ok) {
      return await response.json()
    }

    // Fallback safety analysis
    return {
      score: 75,
      warnings: ["Route analysis unavailable - using default safety assessment"],
      avoidedAreas: [],
    }
  }

  const displayRouteOnMap = (route: any) => {
    if (!mapInstanceRef.current) return

    // Clear existing route
    if (mapInstanceRef.current.getLayer("route")) {
      mapInstanceRef.current.removeLayer("route")
      mapInstanceRef.current.removeSource("route")
    }

    // Add route to map
    const coordinates = route.legs[0].points.map((point: any) => [point.longitude, point.latitude])

    mapInstanceRef.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    })

    mapInstanceRef.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#4CAF50",
        "line-width": 6,
      },
    })

    // Fit map to route bounds
    const bounds = new window.tt.LngLatBounds()
    coordinates.forEach((coord: number[]) => bounds.extend(coord))
    mapInstanceRef.current.fitBounds(bounds, { padding: 50 })
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const startNavigation = () => {
    if (!route || !currentLocation) {
      toast({
        title: "Error",
        description: "Route or current location not available",
        variant: "destructive",
      })
      return
    }

    const destination = route.waypoints[route.waypoints.length - 1]

    // Try multiple navigation options
    const options = [
      {
        name: "TomTom Maps",
        url: `https://maps.tomtom.com/directions?from=${currentLocation.lat},${currentLocation.lng}&to=${destination.lat},${destination.lng}`,
      },
      {
        name: "Google Maps",
        url: `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=walking`,
      },
      {
        name: "Apple Maps (iOS)",
        url: `http://maps.apple.com/?saddr=${currentLocation.lat},${currentLocation.lng}&daddr=${destination.lat},${destination.lng}&dirflg=w`,
      },
    ]

    // Detect device and use appropriate map
    const userAgent = navigator.userAgent
    let selectedOption = options[1] // Default to Google Maps

    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      selectedOption = options[2] // Use Apple Maps on iOS
    }

    try {
      window.open(selectedOption.url, "_blank")
      toast({
        title: "Navigation Started",
        description: `Opening in ${selectedOption.name}`,
      })
    } catch (error) {
      // Fallback: show all options
      const message = `Navigation options:\n\n${options.map((opt) => `${opt.name}: ${opt.url}`).join("\n\n")}`
      alert(message)
    }
  }

  const shareRoute = async () => {
    if (!route) return

    try {
      const routeUrl = `https://hersafety.app/shared-route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`

      if (navigator.share) {
        await navigator.share({
          title: "HerSafety Route",
          text: `I'm traveling from ${origin} to ${destination}. Track my route for safety.`,
          url: routeUrl,
        })
      } else {
        await navigator.clipboard.writeText(routeUrl)
        toast({
          title: "Route Shared",
          description: "Route link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing route:", error)
    }
  }

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSafetyBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20"
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-red-100 dark:bg-red-900/20"
  }

  const startLiveTracking = async () => {
    if (!route || !currentLocation) return

    try {
      const trackingId = `route-${Date.now()}`

      // Start tracking location every 30 seconds
      const trackingInterval = setInterval(async () => {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000,
            })
          })

          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          // Send location update to backend
          await fetch("/api/route/live-tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: newLocation,
              routeId: trackingId,
              status: "in_progress",
              emergencyContacts: emergencyContacts.map((c) => c.phone),
            }),
          })

          // Update current location
          setCurrentLocation(newLocation)
        } catch (error) {
          console.error("Location tracking error:", error)
        }
      }, 30000)

      // Store tracking interval for cleanup
      localStorage.setItem("trackingInterval", trackingInterval.toString())

      toast({
        title: "Live Tracking Started",
        description: "Your location is being shared with emergency contacts",
      })
    } catch (error) {
      console.error("Failed to start live tracking:", error)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 safe-gradient rounded-full flex items-center justify-center">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">SafeRoute Navigator</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Find the safest route with real-time mapping</p>
        </div>

        {/* Map Container */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div ref={mapRef} className="w-full h-64 rounded-lg" />
            {!mapLoaded && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Plan Your Safe Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">From</label>
              <Input
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value)
                  searchLocations(e.target.value, false)
                }}
                onFocus={() => setShowOriginSuggestions(originSuggestions.length > 0)}
                placeholder="Enter starting location"
                className="w-full"
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {originSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectLocation(suggestion, false)}
                    >
                      <div className="font-medium text-sm">{suggestion.address}</div>
                      <div className="text-xs text-gray-500">{suggestion.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">To</label>
              <Input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value)
                  searchLocations(e.target.value, true)
                }}
                onFocus={() => setShowDestinationSuggestions(destinationSuggestions.length > 0)}
                placeholder="Enter destination"
                className="w-full"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {destinationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectLocation(suggestion, true)}
                    >
                      <div className="font-medium text-sm">{suggestion.address}</div>
                      <div className="text-xs text-gray-500">{suggestion.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={findSafeRoute} disabled={loading} className="w-full safe-gradient text-white">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Finding Safe Route...
                </>
              ) : (
                <>
                  <Route className="w-4 h-4 mr-2" />
                  Find Safe Route
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Route Results */}
        {route && (
          <div className="space-y-4">
            {/* Safety Score */}
            <Card className={getSafetyBg(route.safetyScore)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    <span className="font-medium">Safety Score</span>
                  </div>
                  <span className={`text-2xl font-bold ${getSafetyColor(route.safetyScore)}`}>
                    {route.safetyScore}/100
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Route Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Distance:</span>
                    <span className="font-medium">{route.distance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Duration:</span>
                    <span className="font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {route.duration}
                    </span>
                  </div>
                </div>

                {route.avoidedAreas.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-green-600 mb-1">✓ Avoided Areas:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {route.avoidedAreas.map((area, index) => (
                        <li key={index}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Warnings */}
            {route.warnings.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Safety Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {route.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={startNavigation} className="w-full gradient-bg text-white">
                <Zap className="w-4 h-4 mr-2" />
                Start Navigation
              </Button>
              <Button onClick={shareRoute} variant="outline" className="w-full bg-transparent">
                Share Route with Contacts
              </Button>
            </div>
          </div>
        )}

        {/* Safety Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Safety Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Stay on well-lit, busy streets
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Keep your phone charged and accessible
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Share your location with trusted contacts
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Trust your instincts and avoid isolated areas
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
