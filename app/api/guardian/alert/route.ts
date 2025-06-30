import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { trigger, location, timestamp, stealthMode } = await request.json()

    // Log the guardian alert
    console.log("Guardian Alert:", { trigger, location, timestamp, stealthMode })

    // In a real app, you would:
    // 1. Save to guardian_logs table
    // 2. Send emergency alerts if threat level is high
    // 3. Notify emergency contacts
    // 4. Alert nearby users if appropriate

    const supabase = createClient()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (hasRealCredentials) {
      // Save to database
      await supabase.from("guardian_logs").insert([
        {
          audio_transcript: trigger,
          latitude: location?.lat,
          longitude: location?.lng,
          triggered_at: timestamp,
          trigger_type: "auto",
        },
      ])
    }

    // Send emergency alerts based on trigger severity
    if (trigger.includes("High audio level") || trigger.includes("Sudden movement")) {
      // Send SMS/Email alerts
      await fetch("/api/sos/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          message: `Guardian Mode Alert: ${trigger}`,
          timestamp,
        }),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Guardian alert processed",
      alertSent: !stealthMode,
    })
  } catch (error) {
    console.error("Error processing guardian alert:", error)
    return NextResponse.json({ error: "Failed to process alert" }, { status: 500 })
  }
}
