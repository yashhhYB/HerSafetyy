import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { route, origin, destination, timeOfDay } = await request.json()

    // Analyze route for safety factors
    const safetyAnalysis = await analyzeSafetyFactors(route, timeOfDay)

    return NextResponse.json(safetyAnalysis)
  } catch (error) {
    console.error("Error analyzing route safety:", error)
    return NextResponse.json({ error: "Failed to analyze route safety" }, { status: 500 })
  }
}

async function analyzeSafetyFactors(routePoints: any[], timeOfDay: number) {
  // Safety scoring algorithm
  let safetyScore = 85 // Base safety score
  const warnings: string[] = []
  const avoidedAreas: string[] = []

  // Time-based safety adjustments
  if (timeOfDay >= 22 || timeOfDay <= 5) {
    safetyScore -= 15
    warnings.push("Late night travel - extra caution advised")
  } else if (timeOfDay >= 18 && timeOfDay <= 21) {
    safetyScore -= 5
    warnings.push("Evening hours - stay in well-lit areas")
  }

  // Analyze route characteristics
  const routeLength = routePoints.length

  // Check for isolated areas (mock analysis based on coordinate patterns)
  let isolatedSegments = 0
  for (let i = 0; i < routePoints.length - 1; i++) {
    const point1 = routePoints[i]
    const point2 = routePoints[i + 1]

    // Mock check for isolated areas (in real implementation, use POI data)
    if (isIsolatedArea(point1.latitude, point1.longitude)) {
      isolatedSegments++
    }
  }

  if (isolatedSegments > routeLength * 0.3) {
    safetyScore -= 20
    warnings.push("Route passes through isolated areas - consider alternative")
    avoidedAreas.push("Industrial zones with poor lighting")
  }

  // Check for high-crime areas (mock data)
  const highCrimeAreas = await checkHighCrimeAreas(routePoints)
  if (highCrimeAreas.length > 0) {
    safetyScore -= 15
    warnings.push("Route passes near areas with recent safety incidents")
    avoidedAreas.push(...highCrimeAreas)
  }

  // Check for well-lit areas and police presence
  const wellLitSegments = await checkLightingAndSafety(routePoints)
  if (wellLitSegments > routeLength * 0.7) {
    safetyScore += 10
    avoidedAreas.push("Dark alleys and unlit paths")
  }

  // Traffic and crowd density analysis
  const crowdDensity = await analyzeCrowdDensity(routePoints, timeOfDay)
  if (crowdDensity === "high") {
    safetyScore += 5
  } else if (crowdDensity === "low") {
    safetyScore -= 10
    warnings.push("Route has low foot traffic - stay alert")
  }

  // Emergency services proximity
  const emergencyProximity = await checkEmergencyServices(routePoints)
  if (emergencyProximity === "good") {
    safetyScore += 5
  } else {
    safetyScore -= 5
    warnings.push("Limited emergency services coverage on this route")
  }

  // Ensure score stays within bounds
  safetyScore = Math.max(0, Math.min(100, safetyScore))

  return {
    score: Math.round(safetyScore),
    warnings,
    avoidedAreas,
    analysis: {
      timeOfDay: timeOfDay >= 22 || timeOfDay <= 5 ? "night" : timeOfDay >= 18 ? "evening" : "day",
      isolatedSegments,
      crowdDensity,
      emergencyProximity,
      lightingQuality: wellLitSegments > routeLength * 0.7 ? "good" : "poor",
    },
  }
}

function isIsolatedArea(lat: number, lng: number): boolean {
  // Mock implementation - in real app, check against POI database
  // Areas with fewer commercial/residential POIs are considered isolated
  const hash = Math.abs(Math.sin(lat * lng) * 10000)
  return hash % 100 < 20 // 20% chance of being isolated
}

async function checkHighCrimeAreas(routePoints: any[]): Promise<string[]> {
  // Mock implementation - in real app, check against crime database
  const highCrimeAreas: string[] = []

  // Simulate checking against known high-crime coordinates
  const knownHighCrimeAreas = [
    { lat: 28.6562, lng: 77.241, name: "Yamuna Bank area" },
    { lat: 28.5653, lng: 77.2434, name: "Lajpat Nagar late hours" },
  ]

  for (const point of routePoints) {
    for (const crimeArea of knownHighCrimeAreas) {
      const distance = calculateDistance(point.latitude, point.longitude, crimeArea.lat, crimeArea.lng)
      if (distance < 0.5) {
        // Within 500m
        if (!highCrimeAreas.includes(crimeArea.name)) {
          highCrimeAreas.push(crimeArea.name)
        }
      }
    }
  }

  return highCrimeAreas
}

async function checkLightingAndSafety(routePoints: any[]): Promise<number> {
  // Mock implementation - in real app, use street lighting data
  let wellLitSegments = 0

  for (const point of routePoints) {
    // Simulate checking lighting data
    const hash = Math.abs(Math.sin(point.latitude * point.longitude) * 10000)
    if (hash % 100 < 70) {
      // 70% chance of being well-lit
      wellLitSegments++
    }
  }

  return wellLitSegments
}

async function analyzeCrowdDensity(routePoints: any[], timeOfDay: number): Promise<"high" | "medium" | "low"> {
  // Mock implementation - in real app, use real-time crowd data
  if (timeOfDay >= 9 && timeOfDay <= 18) {
    return "high" // Business hours
  } else if (timeOfDay >= 18 && timeOfDay <= 22) {
    return "medium" // Evening hours
  } else {
    return "low" // Night/early morning
  }
}

async function checkEmergencyServices(routePoints: any[]): Promise<"good" | "fair" | "poor"> {
  // Mock implementation - in real app, check proximity to hospitals, police stations
  const emergencyServices = [
    { lat: 28.6315, lng: 77.2167, type: "police" },
    { lat: 28.5672, lng: 77.21, type: "hospital" },
    { lat: 28.6247, lng: 77.2442, type: "police" },
  ]

  let nearbyServices = 0
  for (const point of routePoints) {
    for (const service of emergencyServices) {
      const distance = calculateDistance(point.latitude, point.longitude, service.lat, service.lng)
      if (distance < 2) {
        // Within 2km
        nearbyServices++
        break
      }
    }
  }

  const coverage = nearbyServices / routePoints.length
  if (coverage > 0.7) return "good"
  if (coverage > 0.4) return "fair"
  return "poor"
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
