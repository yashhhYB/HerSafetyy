"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Phone, MapPin, CheckCircle, Edit, Plus, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export default function SOSPage() {
  const [isEmergency, setIsEmergency] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>("")
  const [alertSent, setAlertSent] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [editingContacts, setEditingContacts] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })
  const [locationError, setLocationError] = useState<string>("")
  const [gettingLocation, setGettingLocation] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadEmergencyContacts()
    getCurrentLocation()
  }, [])

  const loadEmergencyContacts = () => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem("emergencyContacts")
    if (saved) {
      setEmergencyContacts(JSON.parse(saved))
    } else {
      // Default contacts
      const defaultContacts: EmergencyContact[] = [
        { id: "1", name: "Emergency Contact 1", phone: "+919876543210", relationship: "Family" },
        { id: "2", name: "Emergency Contact 2", phone: "+918765432109", relationship: "Friend" },
        { id: "3", name: "Emergency Contact 3", phone: "+917654321098", relationship: "Colleague" },
      ]
      setEmergencyContacts(defaultContacts)
      localStorage.setItem("emergencyContacts", JSON.stringify(defaultContacts))
    }
  }

  const saveEmergencyContacts = (contacts: EmergencyContact[]) => {
    setEmergencyContacts(contacts)
    localStorage.setItem("emergencyContacts", JSON.stringify(contacts))
  }

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setLocationError("")

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(coords)

        // Get readable address using reverse geocoding
        try {
          const addressText = await reverseGeocode(coords.lat, coords.lng)
          setAddress(addressText)
        } catch (error) {
          setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`)
        }

        setGettingLocation(false)
        toast({
          title: "Location Found",
          description: "Your current location has been detected",
        })
      },
      (error) => {
        let errorMessage = "Failed to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setLocationError(errorMessage)
        setGettingLocation(false)
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      )

      if (response.ok) {
        const data = await response.json()
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const handleEmergency = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please allow location access for emergency alerts",
        variant: "destructive",
      })
      getCurrentLocation()
      return
    }

    if (emergencyContacts.length === 0) {
      toast({
        title: "No Emergency Contacts",
        description: "Please add emergency contacts first",
        variant: "destructive",
      })
      return
    }

    setIsEmergency(true)
    setCountdown(5)

    // Countdown before sending alert
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          sendEmergencyAlert()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const sendEmergencyAlert = async () => {
    try {
      // Get fresh location
      await getCurrentLocationForEmergency()

      const response = await fetch("/api/sos/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          address,
          emergencyContacts,
          message: "🚨 EMERGENCY ALERT: I need immediate help. This is an automated message from HerSafety app.",
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setAlertSent(true)
        toast({
          title: "Emergency Alert Sent",
          description: `Alert sent to ${result.contactsNotified} contacts`,
        })
      } else {
        throw new Error("Failed to send alert")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emergency alert. Please call directly.",
        variant: "destructive",
      })
      // Show emergency numbers for manual calling
      showEmergencyNumbers()
    }
  }

  const getCurrentLocationForEmergency = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported")
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(coords)

          try {
            const addressText = await reverseGeocode(coords.lat, coords.lng)
            setAddress(addressText)
          } catch (error) {
            setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`)
          }

          resolve()
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        },
      )
    })
  }

  const showEmergencyNumbers = () => {
    const numbers = emergencyContacts.map((contact) => `${contact.name}: ${contact.phone}`).join("\n")
    alert(`Please call emergency contacts manually:\n\n${numbers}\n\nPolice: 100\nEmergency: 112`)
  }

  const cancelEmergency = () => {
    setIsEmergency(false)
    setCountdown(0)
    setAlertSent(false)
  }

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Error",
        description: "Please fill in name and phone number",
        variant: "destructive",
      })
      return
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[\d\s\-$$$$]{10,}$/
    if (!phoneRegex.test(newContact.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact,
    }

    const updatedContacts = [...emergencyContacts, contact]
    saveEmergencyContacts(updatedContacts)
    setNewContact({ name: "", phone: "", relationship: "" })

    toast({
      title: "Contact Added",
      description: "Emergency contact added successfully",
    })
  }

  const removeEmergencyContact = (id: string) => {
    const updatedContacts = emergencyContacts.filter((contact) => contact.id !== id)
    saveEmergencyContacts(updatedContacts)

    toast({
      title: "Contact Removed",
      description: "Emergency contact removed",
    })
  }

  const updateEmergencyContact = (id: string, field: string, value: string) => {
    const updatedContacts = emergencyContacts.map((contact) =>
      contact.id === id ? { ...contact, [field]: value } : contact,
    )
    saveEmergencyContacts(updatedContacts)
  }

  if (alertSent) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Emergency Alert Sent</h2>
            <p className="text-gray-600 mb-4">
              Your emergency contacts have been notified with your location and help message.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Your Location:</strong>
                <br />
                {address || "Location coordinates shared"}
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-6">Stay calm. Help is on the way.</p>
            <div className="space-y-2">
              <Button onClick={() => window.open("tel:100")} className="w-full bg-red-600 hover:bg-red-700">
                Call Police: 100
              </Button>
              <Button onClick={cancelEmergency} variant="outline" className="w-full bg-transparent">
                Close
              </Button>
            </div>
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
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Emergency SOS</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Press the button below if you need immediate help</p>
        </div>

        {/* Emergency Button */}
        {!isEmergency ? (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <Button
                onClick={handleEmergency}
                disabled={gettingLocation}
                className="w-32 h-32 rounded-full coral-gradient text-white text-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 animate-pulse-slow"
              >
                {gettingLocation ? "GETTING LOCATION..." : "HELP ME"}
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                Tap to send emergency alert to your contacts
              </p>
              {locationError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {locationError}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-6 text-center">
              <div className="text-6xl font-bold text-red-600 mb-2">{countdown}</div>
              <p className="text-red-600 font-semibold mb-4">Sending emergency alert in {countdown} seconds...</p>
              <Button
                onClick={cancelEmergency}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white bg-transparent"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {location ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">{address}</p>
                <p className="text-xs text-gray-500">
                  Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <p className="text-xs text-green-600 mt-1">✓ Location detected</p>
              </div>
            ) : gettingLocation ? (
              <p className="text-sm text-gray-500">Getting your location...</p>
            ) : (
              <div className="text-sm text-red-600">
                <p>{locationError || "Location not available"}</p>
                <Button variant="outline" size="sm" onClick={getCurrentLocation} className="mt-2 bg-transparent">
                  Enable Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2" />
                Emergency Contacts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingContacts(!editingContacts)}>
                {editingContacts ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {editingContacts ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(contact.id, "name", e.target.value)}
                        placeholder="Name"
                        className="text-sm"
                      />
                      <Input
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(contact.id, "phone", e.target.value)}
                        placeholder="Phone"
                        className="text-sm"
                      />
                      <Input
                        value={contact.relationship}
                        onChange={(e) => updateEmergencyContact(contact.id, "relationship", e.target.value)}
                        placeholder="Relationship"
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="font-medium text-sm">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.phone}</div>
                      <div className="text-xs text-blue-600">{contact.relationship}</div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 ml-3">
                    {!editingContacts && (
                      <Button size="sm" variant="outline" onClick={() => window.open(`tel:${contact.phone}`)}>
                        Call
                      </Button>
                    )}
                    {editingContacts && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {editingContacts && (
                <div className="p-3 border border-gray-200 rounded-lg space-y-3">
                  <Input
                    placeholder="Contact Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone Number (e.g., +919876543210)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Relationship (e.g., Family, Friend)"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  />
                  <Button onClick={addEmergencyContact} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Emergency Numbers */}
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-800 dark:text-red-200">Quick Emergency Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => window.open("tel:100")}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Police: 100
              </Button>
              <Button
                onClick={() => window.open("tel:112")}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Emergency: 112
              </Button>
              <Button
                onClick={() => window.open("tel:108")}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Ambulance: 108
              </Button>
              <Button
                onClick={() => window.open("tel:181")}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Women Help: 181
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voice Activation Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            💡 You can also say "Help me" or shake your phone to trigger SOS
          </p>
        </div>
      </div>
    </div>
  )
}
