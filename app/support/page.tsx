"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Navigation } from "lucide-react"

interface SupportService {
  id: string
  name: string
  type: "police" | "hospital" | "ngo" | "legal"
  address: string
  phone: string
  distance: number
  isOpen: boolean
  rating: number
  services: string[]
  coordinates: { lat: number; lng: number }
}

export default function SupportPage() {
  const [services, setServices] = useState<SupportService[]>([])
  const [filteredServices, setFilteredServices] = useState<SupportService[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getCurrentLocation()
    fetchSupportServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchTerm, typeFilter, locationFilter])

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

  const fetchSupportServices = async () => {
    // Mock data - in real app, fetch from API
    const mockServices: SupportService[] = [
      {
        id: "1",
        name: "Delhi Police Station - Connaught Place",
        type: "police",
        address: "Connaught Place, New Delhi, Delhi 110001",
        phone: "+91-11-23341234",
        distance: 1.2,
        isOpen: true,
        rating: 4.2,
        services: ["Emergency Response", "FIR Registration", "Women Cell"],
        coordinates: { lat: 28.6315, lng: 77.2167 },
      },
      {
        id: "2",
        name: "All India Institute of Medical Sciences",
        type: "hospital",
        address: "Sri Aurobindo Marg, New Delhi, Delhi 110029",
        phone: "+91-11-26588500",
        distance: 3.5,
        isOpen: true,
        rating: 4.8,
        services: ["Emergency Care", "Trauma Center", "Women Health"],
        coordinates: { lat: 28.5672, lng: 77.21 },
      },
      {
        id: "3",
        name: "Jagori Women's Organization",
        type: "ngo",
        address: "B-114, Shivalik, Malviya Nagar, New Delhi 110017",
        phone: "+91-11-26691219",
        distance: 2.8,
        isOpen: true,
        rating: 4.6,
        services: ["Counseling", "Legal Aid", "Safety Training"],
        coordinates: { lat: 28.5355, lng: 77.2065 },
      },
      {
        id: "4",
        name: "Delhi Legal Services Authority",
        type: "legal",
        address: "Delhi High Court Complex, New Delhi 110003",
        phone: "+91-11-23385010",
        distance: 2.1,
        isOpen: false,
        rating: 4.1,
        services: ["Free Legal Aid", "Women Rights", "Court Assistance"],
        coordinates: { lat: 28.6247, lng: 77.2442 },
      },
      {
        id: "5",
        name: "Safdarjung Hospital",
        type: "hospital",
        address: "Ansari Nagar West, New Delhi, Delhi 110029",
        phone: "+91-11-26165060",
        distance: 4.2,
        isOpen: true,
        rating: 4.3,
        services: ["Emergency Care", "Gynecology", "Mental Health"],
        coordinates: { lat: 28.5706, lng: 77.2081 },
      },
      {
        id: "6",
        name: "Women Power Connect",
        type: "ngo",
        address: "Lajpat Nagar, New Delhi, Delhi 110024",
        phone: "+91-11-29834567",
        distance: 5.1,
        isOpen: true,
        rating: 4.4,
        services: ["Support Groups", "Skill Development", "Emergency Shelter"],
        coordinates: { lat: 28.5653, lng: 77.2434 },
      },
    ]

    setServices(mockServices)
  }

  const filterServices = () => {
    let filtered = services

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.services.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((service) => service.type === typeFilter)
    }

    // Filter by location/distance
    if (locationFilter === "nearby") {
      filtered = filtered.filter((service) => service.distance <= 3)
    } else if (locationFilter === "open") {
      filtered = filtered.filter((service) => service.isOpen)
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance)

    setFilteredServices(filtered)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "police":
        return "👮‍♀️"
      case "hospital":
        return "🏥"
      case "ngo":
        return "🤝"
      case "legal":
        return "⚖️"
      default:
        return "📍"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "police":
        return "bg-blue-100 text-blue-800"
      case "hospital":
        return "bg-red-100 text-red-800"
      case "ngo":
        return "bg-green-100 text-green-800"
      case "legal":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openInMaps = (service: SupportService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.coordinates.lat},${service.coordinates.lng}`
    window.open(url, "_blank")
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Support Directory</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Find help and support services near you</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <Input
              placeholder="Search services, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="hospital">Hospitals</SelectItem>
                  <SelectItem value="ngo">NGOs</SelectItem>
                  <SelectItem value="legal">Legal Aid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="nearby">Nearby (3km)</SelectItem>
                  <SelectItem value="open">Open Now</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button className="coral-gradient text-white" onClick={() => window.open("tel:100")}>
            <Phone className="w-4 h-4 mr-2" />
            Call Police
          </Button>
          <Button className="safe-gradient text-white" onClick={() => window.open("tel:108")}>
            <Phone className="w-4 h-4 mr-2" />
            Call Ambulance
          </Button>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-600 dark:text-gray-300">No services found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getTypeIcon(service.type)}</div>
                      <div className="flex-1">
                        <CardTitle className="text-sm leading-tight">{service.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTypeColor(service.type)}>{service.type.toUpperCase()}</Badge>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">⭐ {service.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {service.isOpen ? (
                        <Badge className="bg-green-100 text-green-800">Open</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Closed</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <MapPin className="w-3 h-3 mr-1 mt-0.5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300 text-xs leading-tight">
                        {service.address} ({service.distance} km away)
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300 text-xs">{service.phone}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Services:</div>
                    <div className="flex flex-wrap gap-1">
                      {service.services.map((serviceItem, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {serviceItem}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${service.phone}`)}
                      className="flex-1"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openInMaps(service)} className="flex-1">
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Emergency Banner */}
        <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🚨</div>
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">In Emergency?</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">Don't wait - call for immediate help</p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => window.open("tel:100")}
              >
                Police: 100
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => window.open("tel:112")}
              >
                Emergency: 112
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
