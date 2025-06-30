import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { isGuardian } = await request.json()

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
        is_guardian: isGuardian,
        guardian_since: isGuardian ? new Date().toISOString() : null,
        last_active: new Date().toISOString(),
      })

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ error: "Failed to update guardian status" }, { status: 500 })
      }
    }

    console.log(`Guardian status ${isGuardian ? "enabled" : "disabled"} for user`)

    return NextResponse.json({
      success: true,
      isGuardian,
      message: isGuardian
        ? "You are now a Guardian! Thank you for helping protect our community."
        : "Guardian status disabled. You can re-enable it anytime.",
    })
  } catch (error) {
    console.error("Error toggling guardian status:", error)
    return NextResponse.json({ error: "Failed to toggle guardian status" }, { status: 500 })
  }
}
