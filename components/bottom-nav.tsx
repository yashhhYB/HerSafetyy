"use client"

import { Home, Shield, MapPin, AlertTriangle, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Shield, label: "SOS", href: "/sos" },
    { icon: MapPin, label: "Route", href: "/safe-route" },
    { icon: AlertTriangle, label: "Radar", href: "/radar" },
    { icon: Users, label: "Grid", href: "/guardian-grid" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href === "/guardian-grid" && pathname.startsWith("/guardian-grid"))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? "text-[#2c3e50] bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                  : "text-gray-500 hover:text-[#2c3e50] dark:text-gray-400 dark:hover:text-blue-400"
              }`}
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
