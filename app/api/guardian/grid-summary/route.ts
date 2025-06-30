import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { location, timeRange } = await request.json()

    // Generate mock tile data for 5x5 grid around user location
    const tiles = []
    const baseLatOffset = -0.01 // Start 1km north
    const baseLngOffset = -0.01 // Start 1km west

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const tileLat = location.lat + baseLatOffset + row * 0.005 // ~500m per tile
        const tileLng = location.lng + baseLngOffset + col * 0.005

        // Generate tile code
        const tileCode = generateTileCode(tileLat, tileLng)

        // Mock safety data based on position and randomness
        const safetyLevels = ["safe", "monitored", "caution", "danger"]
        const weights = [0.4, 0.3, 0.2, 0.1] // Bias toward safer areas
        const safetyLevel = weightedRandom(safetyLevels, weights)

        // Generate incident count based on safety level
        const incidentCounts = {
          safe: Math.floor(Math.random() * 2),
          monitored: Math.floor(Math.random() * 5),
          caution: Math.floor(Math.random() * 10) + 2,
          danger: Math.floor(Math.random() * 15) + 5,
        }

        const incidentCount = incidentCounts[safetyLevel as keyof typeof incidentCounts]
        const guardianCount = Math.floor(Math.random() * 8) + (safetyLevel === "safe" ? 3 : 1)

        // Generate AI summary using mock GPT-like responses
        const summaries = {
          safe: "Well-patrolled area with good lighting and regular foot traffic. Multiple guardians active. No recent incidents reported.",
          monitored:
            "Moderate activity area with some guardian presence. Occasional minor incidents but generally secure during daylight hours.",
          caution:
            "Area with increased incident reports. Limited guardian coverage. Recommend avoiding after dark and staying in groups.",
          danger:
            "High-risk zone with multiple recent incidents. Minimal guardian presence. Authorities have been notified. Avoid if possible.",
        }

        tiles.push({
          tileCode,
          safetyLevel,
          incidentCount,
          lastIncident: incidentCount > 0 ? getRandomTimeAgo(timeRange) : null,
          summary: summaries[safetyLevel as keyof typeof summaries],
          coordinates: { lat: tileLat, lng: tileLng },
          population: Math.floor(Math.random() * 1000) + 100,
          guardianCount,
        })
      }
    }

    return NextResponse.json({
      success: true,
      tiles,
      timeRange,
      lastUpdated: new Date().toISOString(),
      totalTiles: tiles.length,
      summary: {
        safe: tiles.filter((t) => t.safetyLevel === "safe").length,
        monitored: tiles.filter((t) => t.safetyLevel === "monitored").length,
        caution: tiles.filter((t) => t.safetyLevel === "caution").length,
        danger: tiles.filter((t) => t.safetyLevel === "danger").length,
      },
    })
  } catch (error) {
    console.error("Error fetching grid summary:", error)
    return NextResponse.json({ error: "Failed to fetch grid summary" }, { status: 500 })
  }
}

function generateTileCode(lat: number, lng: number): string {
  const latCode = Math.floor((lat + 90) * 1000)
    .toString(36)
    .slice(-3)
    .toUpperCase()
  const lngCode = Math.floor((lng + 180) * 1000)
    .toString(36)
    .slice(-3)
    .toUpperCase()
  return latCode + lngCode
}

function weightedRandom(items: string[], weights: number[]): string {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return items[i]
    }
  }

  return items[0]
}

function getRandomTimeAgo(timeRange: string): string {
  const timeOptions = {
    "1h": ["30 minutes ago", "45 minutes ago", "1 hour ago"],
    "24h": ["2 hours ago", "6 hours ago", "12 hours ago", "1 day ago"],
    "7d": ["2 days ago", "4 days ago", "1 week ago"],
    "30d": ["1 week ago", "2 weeks ago", "1 month ago"],
  }

  const options = timeOptions[timeRange as keyof typeof timeOptions] || timeOptions["24h"]
  return options[Math.floor(Math.random() * options.length)]
}
