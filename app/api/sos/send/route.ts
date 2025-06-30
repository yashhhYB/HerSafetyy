import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { location, address, emergencyContacts, message, timestamp } = await request.json()

    console.log("Emergency alert triggered:", { location, address, timestamp })

    let successfulContacts = 0
    const failedContacts: string[] = []

    // Send SMS to each emergency contact using TextBelt (free SMS service)
    for (const contact of emergencyContacts || []) {
      try {
        const locationText = address || `${location?.lat}, ${location?.lng}`
        const emergencyMessage = `🚨 EMERGENCY ALERT from ${contact.name || "HerSafety User"}\n\n${message}\n\nLocation: ${locationText}\n\nTime: ${new Date(timestamp).toLocaleString()}\n\nGoogle Maps: https://maps.google.com/?q=${location?.lat},${location?.lng}\n\nThis is an automated alert from HerSafety app.`

        // Using TextBelt free SMS API (1 free SMS per day per phone number)
        const smsResponse = await fetch("https://textbelt.com/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: contact.phone,
            message: emergencyMessage,
            key: "textbelt", // Free tier key
          }),
        })

        const smsResult = await smsResponse.json()

        if (smsResult.success) {
          successfulContacts++
          console.log(`SMS sent successfully to ${contact.name} (${contact.phone})`)
        } else {
          failedContacts.push(contact.name)
          console.error(`SMS failed for ${contact.name}:`, smsResult.error)

          // Fallback: Try using a WhatsApp Web link
          const whatsappMessage = encodeURIComponent(emergencyMessage)
          const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^\d]/g, "")}?text=${whatsappMessage}`
          console.log(`WhatsApp fallback link for ${contact.name}: ${whatsappUrl}`)
        }

        // Also try email if available (using a free email service like EmailJS in a real app)
        // For now, we'll log the email content
        console.log(`Emergency email content for ${contact.name}:`, {
          subject: "🚨 EMERGENCY ALERT - Immediate Help Needed",
          body: emergencyMessage,
        })
      } catch (error) {
        console.error(`Failed to contact ${contact.name}:`, error)
        failedContacts.push(contact.name)
      }
    }

    // Send alert to local authorities (mock implementation)
    try {
      const authorityMessage = `Emergency alert from HerSafety app user at location: ${address || `${location?.lat}, ${location?.lng}`}. Time: ${new Date(timestamp).toLocaleString()}. Please check on user safety.`

      // In a real implementation, you would integrate with local emergency services API
      console.log("Alert sent to authorities:", authorityMessage)
    } catch (error) {
      console.error("Failed to alert authorities:", error)
    }

    // Store emergency log (if Supabase is configured)
    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      const hasRealCredentials =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

      if (hasRealCredentials) {
        await supabase.from("emergency_logs").insert([
          {
            user_email: "demo@hersafety.app", // In real app, get from auth
            location_lat: location?.lat,
            location_lng: location?.lng,
            address,
            contacts_notified: successfulContacts,
            message,
            triggered_at: timestamp,
          },
        ])
      }
    } catch (error) {
      console.error("Failed to store emergency log:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Emergency alerts processed",
      contactsNotified: successfulContacts,
      failedContacts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error sending emergency alert:", error)
    return NextResponse.json(
      {
        error: "Failed to send emergency alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
