import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const tileCode = formData.get("tileCode") as string
    const timestamp = formData.get("timestamp") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if Supabase is configured
    const hasRealCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

    let audioUrl = ""
    let transcript = ""

    if (hasRealCredentials) {
      // Upload audio to Supabase Storage
      const fileName = `guardian-audio/${Date.now()}-${audioFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(fileName, audioFile)

      if (uploadError) {
        console.error("Audio upload error:", uploadError)
      } else {
        audioUrl = uploadData.path
      }

      // In real implementation, use OpenAI Whisper API for transcription
      // const transcriptionResponse = await openai.audio.transcriptions.create({
      //   file: audioFile,
      //   model: "whisper-1",
      // })
      // transcript = transcriptionResponse.text

      // Mock transcript for demo
      transcript = "Emergency audio recording captured during Guardian Grid incident detection."

      // Save to database
      await supabase.from("guardian_audio").insert([
        {
          user_email: "demo@hersafety.app", // In real app, get from auth
          audio_url: audioUrl,
          transcript,
          tile_code: tileCode,
          triggered_at: timestamp,
        },
      ])
    } else {
      // Mock processing for demo mode
      transcript = "Mock transcript: Emergency audio recording processed successfully."
      console.log("Audio upload processed in demo mode:", { tileCode, timestamp })
    }

    // Analyze transcript for keywords and threat level
    const threatKeywords = ["help", "stop", "no", "emergency", "danger"]
    const detectedKeywords = threatKeywords.filter((keyword) => transcript.toLowerCase().includes(keyword))

    const threatLevel = detectedKeywords.length > 0 ? "high" : "medium"

    // If high threat level detected, trigger additional alerts
    if (threatLevel === "high") {
      await fetch("/api/guardian/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audio",
          severity: "critical",
          description: `Audio analysis detected distress keywords: ${detectedKeywords.join(", ")}`,
          tileCode,
          settings: { communityAlerts: true },
        }),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Audio processed successfully",
      transcript,
      threatLevel,
      detectedKeywords,
      audioUrl,
    })
  } catch (error) {
    console.error("Error processing audio upload:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
