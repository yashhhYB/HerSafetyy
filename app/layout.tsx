import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BottomNav } from "@/components/bottom-nav"
import { AuthProvider } from "@/components/auth-provider"
import { ConfigBanner } from "@/components/config-banner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HerSafety - Women Safety App",
  description:
    "A comprehensive safety app for women in India with emergency response, AI-based behavior detection, and real-time safety intelligence.",
  manifest: "/manifest.json",
  themeColor: "#2c3e50",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
              <ConfigBanner />
              <main className="pb-20">{children}</main>
              <BottomNav />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
