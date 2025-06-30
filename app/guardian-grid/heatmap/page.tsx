"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Map, RefreshCw, Shield, TrendingUp } from "lucide-react"

interface TileData {
  tileCode: string
  safetyLevel: "safe" | "monitored" | "caution" | "danger"
  incidentCount: number
  lastIncident: string
  summary: string
  coordinates: { lat: number; lng: number }
  population: number
  guardianCount: number
}

export default function HeatmapPage() {
  const [tiles, setTiles] = useState<TileData[]>([])
  const [timeFilter, setTimeFilter] = useState("24h")
  const [loading, setLoading] = useState(true)
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null)

  useEffect(() => {
    fetchHeatmapData()
  }, [timeFilter])

  const fetchHeatmapData = async () => {
    setLoading(true)
    try {
      const position = await getCurrentPosition()

      const response = await fetch("/api/guardian/grid-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: position,
          timeRange: timeFilter,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTiles(data.tiles)
      }
    } catch (error) {
      console.error("Failed to fetch heatmap data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        reject,
      )
    })
  }

  const getSafetyColor = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-500"
      case "monitored":
        return "bg-blue-500"
      case "caution":
        return "bg-yellow-500"
      case "danger":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSafetyBadgeColor = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-100 text-green-800"
      case "monitored":
        return "bg-blue-100 text-blue-800"
      case "caution":
        return "bg-yellow-100 text-yellow-800"
      case "danger":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case "safe":
        return "🛡️"
      case "monitored":
        return "👁️"
      case "caution":
        return "⚠️"
      case "danger":
        return "🚨"
      default:
        return "❓"
    }
  }

  const getSafetyScore = (level: string) => {
    switch (level) {
      case "safe":
        return 90
      case "monitored":
        return 70
      case "caution":
        return 50
      case "danger":
        return 20
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading safety heatmap...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <Map className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Safety Heatmap</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Real-time safety intelligence by area</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last Week</SelectItem>
              <SelectItem value="30d">Last Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchHeatmapData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Safety Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Safe</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Monitored</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Caution</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Danger</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tiles.filter((t) => t.safetyLevel === "safe").length}
              </div>
              <div className="text-xs text-gray-500">Safe Zones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tiles.filter((t) => t.safetyLevel === "caution").length}
              </div>
              <div className="text-xs text-gray-500">Caution Areas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {tiles.filter((t) => t.safetyLevel === "danger").length}
              </div>
              <div className="text-xs text-gray-500">Danger Zones</div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Grid */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Area Grid (1km radius)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-1 mb-4">
              {tiles.slice(0, 25).map((tile, index) => (
                <div
                  key={tile.tileCode}
                  className={`aspect-square ${getSafetyColor(tile.safetyLevel)} rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-bold`}
                  onClick={() => setSelectedTile(tile)}
                  title={`${tile.tileCode}: ${tile.safetyLevel}`}
                >
                  {getSafetyIcon(tile.safetyLevel)}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">Tap any tile for detailed information</p>
          </CardContent>
        </Card>

        {/* Selected Tile Details */}
        {selectedTile && (
          <Card className="mb-6 border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tile {selectedTile.tileCode}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTile(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Safety Level:</span>
                <Badge className={getSafetyBadgeColor(selectedTile.safetyLevel)}>
                  {getSafetyIcon(selectedTile.safetyLevel)} {selectedTile.safetyLevel.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Safety Score:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getSafetyColor(selectedTile.safetyLevel)}`}
                      style={{ width: `${getSafetyScore(selectedTile.safetyLevel)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{getSafetyScore(selectedTile.safetyLevel)}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Incidents ({timeFilter}):</span>
                  <div className="font-medium">{selectedTile.incidentCount}</div>
                </div>
                <div>
                  <span className="text-gray-500">Guardians:</span>
                  <div className="font-medium">{selectedTile.guardianCount}</div>
                </div>
              </div>

              {selectedTile.summary && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Summary:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedTile.summary}
                  </p>
                </div>
              )}

              {selectedTile.lastIncident && (
                <div className="text-xs text-gray-500">Last incident: {selectedTile.lastIncident}</div>
              )}

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Shield className="w-3 h-3 mr-1" />
                  Avoid This Area
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  View Trends
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tile List */}
        <div className="space-y-3">
          <h3 className="font-medium text-lg">Nearby Areas</h3>
          {tiles.slice(0, 10).map((tile) => (
            <Card
              key={tile.tileCode}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTile(tile)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 ${getSafetyColor(tile.safetyLevel)} rounded flex items-center justify-center text-white text-sm`}
                    >
                      {getSafetyIcon(tile.safetyLevel)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">Tile {tile.tileCode}</div>
                      <div className="text-xs text-gray-500">
                        {tile.incidentCount} incidents • {tile.guardianCount} guardians
                      </div>
                    </div>
                  </div>
                  <Badge className={getSafetyBadgeColor(tile.safetyLevel)}>{tile.safetyLevel}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Safety Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🧠 Safety Intelligence:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Heatmap updates every 15 minutes with new data</li>
            <li>• AI analyzes patterns from incidents and reports</li>
            <li>• Green areas have active guardian presence</li>
            <li>• Red areas should be avoided, especially after dark</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
