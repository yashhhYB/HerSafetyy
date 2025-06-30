"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, MapPin, Clock, Shield, Phone, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Guardian {
  id: string
  name: string
  distance: number
  responseTime: string
  isAvailable: boolean
  isAnonymous: boolean
  rating: number
  lastSeen: string
  specialties: string[]
}

export default function NearbyGuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [isGuardian, setIsGuardian] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchNearbyGuardians()
  }, [])

  const fetchNearbyGuardians = async () => {
    try {
      const position = await getCurrentPosition()

      const response = await fetch("/api/guardian/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: position }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuardians(data.guardians)
        setIsGuardian(data.userIsGuardian)
      }
    } catch (error) {
      console.error("Failed to fetch guardians:", error)
    } finally {
      setLoading(false)
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

  const toggleGuardianStatus = async () => {
    try {
      const response = await fetch("/api/guardian/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGuardian: !isGuardian }),
      })

      if (response.ok) {
        setIsGuardian(!isGuardian)
        toast({
          title: isGuardian ? "Guardian Mode Disabled" : "Guardian Mode Enabled",
          description: isGuardian
            ? "You are no longer visible to nearby users needing help."
            : "You are now available to help others in your area.",
        })
        fetchNearbyGuardians() // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guardian status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const contactGuardian = async (guardianId: string, method: "call" | "message") => {
    try {
      const response = await fetch("/api/guardian/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId, method }),
      })

      if (response.ok) {
        const data = await response.json()

        if (method === "call" && data.phoneNumber) {
          window.open(`tel:${data.phoneNumber}`)
        } else if (method === "message") {
          toast({
            title: "Message Sent",
            description: "Your request for help has been sent to the guardian.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to contact guardian. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding nearby guardians...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Nearby Guardians</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Community members ready to help</p>
        </div>

        {/* Guardian Toggle */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Become a Guardian</h3>
                <p className="text-sm text-gray-500">Help protect others in your community</p>
              </div>
              <Switch
                checked={isGuardian}
                onCheckedChange={toggleGuardianStatus}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {isGuardian && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✅ You are now visible to nearby users who need help. Thank you for making our community safer!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{guardians.length}</div>
              <div className="text-xs text-gray-500">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{guardians.filter((g) => g.isAvailable).length}</div>
              <div className="text-xs text-gray-500">Online</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {guardians.filter((g) => g.distance <= 0.5).length}
              </div>
              <div className="text-xs text-gray-500">Nearby</div>
            </CardContent>
          </Card>
        </div>

        {/* Guardians List */}
        <div className="space-y-4">
          {guardians.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">No guardians found in your area</p>
                <p className="text-sm text-gray-500">
                  Be the first to become a guardian and help protect your community!
                </p>
              </CardContent>
            </Card>
          ) : (
            guardians.map((guardian) => (
              <Card key={guardian.id} className={`${!guardian.isAvailable ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          {guardian.isAnonymous ? "Anonymous Guardian" : guardian.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            className={
                              guardian.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {guardian.isAvailable ? "Available" : "Busy"}
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>⭐ {guardian.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{guardian.distance.toFixed(1)} km away</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>~{guardian.responseTime}</span>
                      </div>
                    </div>

                    {guardian.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {guardian.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {guardian.isAvailable && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => contactGuardian(guardian.id, "message")}
                        className="flex-1"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Request Help
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => contactGuardian(guardian.id, "call")}
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">Last seen: {guardian.lastSeen}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Emergency Actions */}
        <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">In Immediate Danger?</h3>
            <div className="space-y-2">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => (window.location.href = "/sos")}
              >
                🚨 Emergency SOS
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => window.open("tel:100")}
              >
                📞 Call Police (100)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How Guardian Network Works:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Guardians are verified community volunteers</li>
            <li>• They receive alerts when someone needs help nearby</li>
            <li>• All interactions are logged for safety</li>
            <li>• Emergency services are always notified in critical situations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
