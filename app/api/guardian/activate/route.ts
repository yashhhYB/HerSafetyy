import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { location, tileCode, settings } = await request.json()

    const supabase = createClient()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (hasRealCredentials) {
      // Update user's guardian status
      const { error } = await supabase.from("guardian_users").upsert({
        email: "demo@hersafety.app", // In real app, get from auth
        status: "active",
        gps_tile: tileCode,
        location_lat: location.lat,
        location_lng: location.lng,
        settings: settings,
        last_active: new Date().toISOString(),
      })

      if (error) {
        console.error("Supabase error:", error)
      }
    }

    // Log activation
    console.log("Guardian Grid activated:", { tileCode, location, settings })

    return NextResponse.json({
      success: true,
      message: "Guardian Grid activated successfully",
      tileCode,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error activating Guardian Grid:", error)
    return NextResponse.json({ error: "Failed to activate Guardian Grid" }, { status: 500 })
  }
}
