"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Shield, Bell, Phone, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  priority: number
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  })

  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: "english",
    notifications: true,
    locationSharing: true,
    voiceActivation: true,
    stealthMode: false,
    autoSOS: true,
    soundAlerts: true,
  })

  const [showAddContact, setShowAddContact] = useState(false)
  const { toast } = useToast()
  const { user, isConfigured } = useAuth()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    // Mock data - in real app, fetch from Supabase
    setProfile({
      name: "Demo User",
      email: user?.email || "demo@hersafety.app",
      phone: "+91 98765 43210",
      address: "New Delhi, India",
    })

    setEmergencyContacts([
      {
        id: "1",
        name: "Emergency Contact 1",
        phone: "+91 98765 43210",
        relationship: "Family",
        priority: 1,
      },
      {
        id: "2",
        name: "Emergency Contact 2",
        phone: "+91 87654 32109",
        relationship: "Friend",
        priority: 2,
      },
    ])
  }

  const saveProfile = async () => {
    try {
      // In real app, save to Supabase
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact,
      priority: emergencyContacts.length + 1,
    }

    setEmergencyContacts([...emergencyContacts, contact])
    setNewContact({ name: "", phone: "", relationship: "" })
    setShowAddContact(false)

    toast({
      title: "Contact Added",
      description: "Emergency contact has been added successfully.",
    })
  }

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter((contact) => contact.id !== id))
    toast({
      title: "Contact Removed",
      description: "Emergency contact has been removed.",
    })
  }

  const updatePreference = (key: string, value: boolean | string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))

    // Save preferences
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    })
  }

  const testEmergencyAlert = async () => {
    toast({
      title: "Test Alert Sent",
      description: "Emergency alert test sent to your contacts.",
    })
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Customize your safety preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Full Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone Number</label>
              <Input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Address</label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Enter your address"
              />
            </div>

            <Button onClick={saveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Emergency Contacts
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddContact(true)}>
                <Plus className="w-4 h-4" />
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
                  <div>
                    <div className="font-medium text-sm">{contact.name}</div>
                    <div className="text-xs text-gray-500">{contact.phone}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {contact.relationship}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {showAddContact && (
                <div className="p-3 border border-gray-200 rounded-lg space-y-3">
                  <Input
                    placeholder="Contact Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                  <Select
                    value={newContact.relationship}
                    onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Colleague">Colleague</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={addEmergencyContact} className="flex-1">
                      Add Contact
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddContact(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={testEmergencyAlert} className="w-full mt-4 bg-transparent">
              Test Emergency Alert
            </Button>
          </CardContent>
        </Card>

        {/* Safety Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Safety Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Location Sharing</div>
                <div className="text-xs text-gray-500">Share location with emergency contacts</div>
              </div>
              <Switch
                checked={preferences.locationSharing}
                onCheckedChange={(checked) => updatePreference("locationSharing", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Voice Activation</div>
                <div className="text-xs text-gray-500">Activate SOS with voice commands</div>
              </div>
              <Switch
                checked={preferences.voiceActivation}
                onCheckedChange={(checked) => updatePreference("voiceActivation", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Auto SOS</div>
                <div className="text-xs text-gray-500">Automatic emergency detection</div>
              </div>
              <Switch
                checked={preferences.autoSOS}
                onCheckedChange={(checked) => updatePreference("autoSOS", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Sound Alerts</div>
                <div className="text-xs text-gray-500">Play sounds for notifications</div>
              </div>
              <Switch
                checked={preferences.soundAlerts}
                onCheckedChange={(checked) => updatePreference("soundAlerts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Push Notifications</div>
                <div className="text-xs text-gray-500">Receive safety alerts and updates</div>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => updatePreference("notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Dark Mode</div>
                <div className="text-xs text-gray-500">Use dark theme</div>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked) => updatePreference("darkMode", checked)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Language</label>
              <Select value={preferences.language} onValueChange={(value) => updatePreference("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              📊 Download My Data
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              🔒 Privacy Policy
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              📋 Terms of Service
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              🗑️ Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <h3 className="font-medium text-[#2c3e50] dark:text-white mb-1">HerSafety</h3>
            <p className="text-sm text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-400 mt-2">
              {isConfigured ? "Connected to Supabase" : "Demo Mode - Configure Supabase for full functionality"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
