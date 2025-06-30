import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { location, routeId, status, emergencyContacts } = await request.json()

    const supabase = createClient()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (hasRealCredentials) {
      // Store live tracking data
      await supabase.from("live_tracking").insert([
        {
          user_email: "demo@hersafety.app", // In real app, get from auth
          route_id: routeId,
          current_lat: location.lat,
          current_lng: location.lng,
          status: status, // 'started', 'in_progress', 'completed', 'emergency'
          timestamp: new Date().toISOString(),
        },
      ])
    }

    // Send live location to emergency contacts
    if (emergencyContacts && emergencyContacts.length > 0) {
      await sendLiveLocationUpdate(location, routeId, status, emergencyContacts)
    }

    // Check for route deviations or safety concerns
    const safetyCheck = await performSafetyCheck(location, routeId)

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      safetyStatus: safetyCheck.status,
      alerts: safetyCheck.alerts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating live tracking:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

async function sendLiveLocationUpdate(
  location: { lat: number; lng: number },
  routeId: string,
  status: string,
  emergencyContacts: string[],
) {
  const locationMessage = `Live Location Update: Currently at ${location.lat}, ${location.lng}. Status: ${status}. Track route: https://hersafety.app/track/${routeId}`

  for (const contact of emergencyContacts) {
    console.log(`Live location sent to ${contact}: ${locationMessage}`)
    // In real implementation: send SMS via Twilio
  }
}

async function performSafetyCheck(location: { lat: number; lng: number }, routeId: string) {
  // Check for route deviation
  // Check for unsafe areas
  // Check for emergency situations

  const alerts: string[] = []
  let status = "safe"

  // Mock safety checks
  const unsafeAreas = [
    { lat: 28.6562, lng: 77.241, radius: 0.5, name: "Yamuna Bank area" },
    { lat: 28.5653, lng: 77.2434, radius: 0.3, name: "Lajpat Nagar" },
  ]

  for (const area of unsafeAreas) {
    const distance = calculateDistance(location.lat, location.lng, area.lat, area.lng)
    if (distance < area.radius) {
      alerts.push(`Approaching unsafe area: ${area.name}`)
      status = "caution"
    }
  }

  // Check time of day
  const hour = new Date().getHours()
  if (hour >= 22 || hour <= 5) {
    alerts.push("Late night travel detected - extra caution advised")
    if (status === "safe") status = "caution"
  }

  return { status, alerts }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
