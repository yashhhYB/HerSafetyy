import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { type, severity, description, location, tileCode, settings } = await request.json()

    const supabase = createClient()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (hasRealCredentials) {
      // Log the guardian event
      await supabase.from("guardian_events").insert([
        {
          user_email: "demo@hersafety.app", // In real app, get from auth
          tile_code: tileCode,
          trigger_type: type,
          severity_level: severity,
          description,
          location_lat: location?.lat,
          location_lng: location?.lng,
          triggered_at: new Date().toISOString(),
        },
      ])
    }

    // Determine response actions based on severity
    const actions = []

    if (severity === "high" || severity === "critical") {
      // Send alerts to nearby guardians
      if (settings.communityAlerts) {
        await alertNearbyGuardians(location, tileCode, description, severity)
        actions.push("Nearby guardians alerted")
      }

      // Send to emergency contacts if critical
      if (severity === "critical") {
        await sendEmergencyAlert(location, description)
        actions.push("Emergency contacts notified")
      }

      // Alert authorities for critical incidents
      if (severity === "critical") {
        await alertAuthorities(location, tileCode, description)
        actions.push("Authorities notified")
      }
    }

    console.log("Guardian trigger processed:", { type, severity, tileCode, actions })

    return NextResponse.json({
      success: true,
      message: "Behavior detection processed",
      severity,
      actionsTriggered: actions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing guardian trigger:", error)
    return NextResponse.json({ error: "Failed to process trigger" }, { status: 500 })
  }
}

async function alertNearbyGuardians(location: any, tileCode: string, description: string, severity: string) {
  // In real implementation:
  // 1. Find guardians within 500m radius
  // 2. Send push notifications
  // 3. Send SMS alerts
  // 4. Log alert in database

  console.log(`Alerting nearby guardians in tile ${tileCode}: ${description} (${severity})`)

  // Mock nearby guardians
  const nearbyGuardians = [
    { id: "guardian1", phone: "+919876543210", distance: 0.3 },
    { id: "guardian2", phone: "+918765432109", distance: 0.5 },
  ]

  for (const guardian of nearbyGuardians) {
    console.log(`Alert sent to guardian ${guardian.id} at ${guardian.phone}`)
    // In real app: send SMS via Twilio
  }
}

async function sendEmergencyAlert(location: any, description: string) {
  // Send to emergency contacts
  const emergencyContacts = [
    { name: "Emergency Contact 1", phone: "+919876543210" },
    { name: "Emergency Contact 2", phone: "+918765432109" },
  ]

  for (const contact of emergencyContacts) {
    console.log(`Emergency alert sent to ${contact.name}: ${description}`)
    // In real app: send SMS via Twilio
  }
}

async function alertAuthorities(location: any, tileCode: string, description: string) {
  // Alert police and emergency services
  console.log(`Authorities alerted for tile ${tileCode}: ${description}`)

  // In real implementation:
  // 1. Send alert to nearest police station
  // 2. Create incident report
  // 3. Notify emergency services if needed
}
