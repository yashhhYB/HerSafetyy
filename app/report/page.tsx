"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Camera, MapPin, Send, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportData {
  type: string
  location: string
  description: string
  anonymous: boolean
  media?: File
}

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [reportData, setReportData] = useState<ReportData>({
    type: "",
    location: "",
    description: "",
    anonymous: true,
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const incidentTypes = [
    "Harassment",
    "Stalking",
    "Inappropriate Behavior",
    "Unsafe Area",
    "Poor Lighting",
    "Suspicious Activity",
    "Other",
  ]

  const handleNext = () => {
    if (step === 1 && !reportData.type) {
      toast({
        title: "Error",
        description: "Please select an incident type",
        variant: "destructive",
      })
      return
    }
    if (step === 2 && !reportData.location) {
      toast({
        title: "Error",
        description: "Please provide a location",
        variant: "destructive",
      })
      return
    }
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    if (!reportData.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reportData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        toast({
          title: "Report Submitted",
          description: "Thank you for helping make our community safer.",
        })
      } else {
        throw new Error("Failed to submit report")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportData({
            ...reportData,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          })
          toast({
            title: "Location Added",
            description: "Current location has been added to your report.",
          })
        },
        (error) => {
          toast({
            title: "Error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive",
          })
        },
      )
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Report Submitted</h2>
            <p className="text-gray-600 mb-4">
              Thank you for reporting this incident. Your report helps make our community safer.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Report ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              Return to Home
            </Button>
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
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Report an Incident</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Help make our community safer by reporting incidents
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step ? "bg-[#2c3e50] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
              {i < 3 && <div className={`w-8 h-1 mx-2 ${i < step ? "bg-[#2c3e50]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Incident Type */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What type of incident would you like to report?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={reportData.type} onValueChange={(value) => setReportData({ ...reportData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleNext} className="w-full" disabled={!reportData.type}>
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Where did this incident occur?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={reportData.location}
                  onChange={(e) => setReportData({ ...reportData, location: e.target.value })}
                  placeholder="Enter location or address"
                />
                <Button variant="outline" onClick={getCurrentLocation} className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Use Current Location
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!reportData.location}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Provide details about the incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reportData.description}
                onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                placeholder="Describe what happened..."
                rows={4}
              />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={reportData.anonymous}
                    onCheckedChange={(checked) => setReportData({ ...reportData, anonymous: checked as boolean })}
                  />
                  <label htmlFor="anonymous" className="text-sm">
                    Submit anonymously
                  </label>
                </div>

                <Button variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photo (Optional)
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 coral-gradient text-white">
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Your privacy is important to us. All reports are handled confidentially and securely.
          </p>
        </div>
      </div>
    </div>
  )
}
