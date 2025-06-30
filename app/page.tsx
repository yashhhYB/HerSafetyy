import { Shield, MapPin, AlertTriangle, BookOpen, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: "SOS Help",
      description: "Instant emergency assistance",
      href: "/sos",
      gradient: "coral-gradient",
      delay: "0ms",
    },
    {
      icon: MapPin,
      title: "SafeRoute",
      description: "Navigate safely to your destination",
      href: "/safe-route",
      gradient: "safe-gradient",
      delay: "100ms",
    },
    {
      icon: AlertTriangle,
      title: "Report Incident",
      description: "Report safety concerns anonymously",
      href: "/report",
      gradient: "gradient-bg",
      delay: "200ms",
    },
    {
      icon: BookOpen,
      title: "Learn About Safety",
      description: "Safety tips and resources",
      href: "/learn",
      gradient: "gradient-bg",
      delay: "300ms",
    },
  ]

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#2c3e50] to-[#3498db] rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-2">Welcome to HerSafety</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm px-4">You are not alone. We're here to keep you safe.</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {features.map((feature, index) => (
          <Link key={feature.title} href={feature.href}>
            <Card
              className="h-32 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in border-0 shadow-md"
              style={{ animationDelay: feature.delay }}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 rounded-full ${feature.gradient} flex items-center justify-center mb-2`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-[#2c3e50] dark:text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">{feature.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-3 text-center">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/guardian">
              <Button
                variant="outline"
                className="w-full justify-start bg-white text-[#2c3e50] border-[#2c3e50] hover:bg-[#2c3e50] hover:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Smart Guardian Mode
              </Button>
            </Link>
            <Link href="/radar">
              <Button
                variant="outline"
                className="w-full justify-start bg-white text-[#2c3e50] border-[#2c3e50] hover:bg-[#2c3e50] hover:text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Live Threat Radar
              </Button>
            </Link>
            <Link href="/guardian-grid">
              <Button
                variant="outline"
                className="w-full justify-start bg-white text-[#2c3e50] border-[#2c3e50] hover:bg-[#2c3e50] hover:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Guardian Grid Network
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
