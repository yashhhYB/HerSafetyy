import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()

    // Mock nearby guardians data
    // In real app, query Supabase for guardians within 500m radius
    const mockGuardians = [
      {
        id: "guardian1",
        name: "Sarah K.",
        distance: 0.3,
        responseTime: "2-3 min",
        isAvailable: true,
        isAnonymous: false,
        rating: 4.8,
        lastSeen: "2 minutes ago",
        specialties: ["Self Defense", "First Aid"],
      },
      {
        id: "guardian2",
        name: "Anonymous Guardian",
        distance: 0.5,
        responseTime: "3-5 min",
        isAvailable: true,
        isAnonymous: true,
        rating: 4.6,
        lastSeen: "5 minutes ago",
        specialties: ["Emergency Response"],
      },
      {
        id: "guardian3",
        name: "Priya M.",
        distance: 0.8,
        responseTime: "5-7 min",
        isAvailable: false,
        isAnonymous: false,
        rating: 4.9,
        lastSeen: "1 hour ago",
        specialties: ["Medical Training", "Crisis Support"],
      },
      {
        id: "guardian4",
        name: "Anonymous Guardian",
        distance: 1.2,
        responseTime: "8-10 min",
        isAvailable: true,
        isAnonymous: true,
        rating: 4.5,
        lastSeen: "10 minutes ago",
        specialties: ["Security", "De-escalation"],
      },
    ]

    // Filter by distance (within 500m = 0.5km)
    const nearbyGuardians = mockGuardians.filter((guardian) => guardian.distance <= 0.5)

    return NextResponse.json({
      success: true,
      guardians: nearbyGuardians,
      userIsGuardian: false, // In real app, check user's guardian status
      totalCount: nearbyGuardians.length,
      availableCount: nearbyGuardians.filter((g) => g.isAvailable).length,
    })
  } catch (error) {
    console.error("Error fetching nearby guardians:", error)
    return NextResponse.json({ error: "Failed to fetch nearby guardians" }, { status: 500 })
  }
}
