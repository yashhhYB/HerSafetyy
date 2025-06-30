import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { type, location, description, anonymous, timestamp } = await request.json()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    if (!hasRealCredentials) {
      // Return mock response for demo
      console.log("Mock report created:", { type, location, description, anonymous, timestamp })
      return NextResponse.json({
        success: true,
        reportId: "mock-report-" + Math.random().toString(36).substr(2, 9),
        message: "Report submitted successfully (Demo Mode)",
      })
    }

    const supabase = createClient()

    // Insert report into database
    const { data, error } = await supabase
      .from("incident_reports")
      .insert([
        {
          type,
          location,
          description,
          anonymous,
          timestamp,
          status: "pending",
        },
      ])
      .select()

    if (error) {
      throw error
    }

    // In a real app, you might also:
    // 1. Send notification to authorities if serious
    // 2. Update safety heatmaps
    // 3. Trigger alerts for nearby users

    return NextResponse.json({
      success: true,
      reportId: data[0]?.id,
      message: "Report submitted successfully",
    })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}
