"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ConfigBanner() {
  const [dismissed, setDismissed] = useState(false)

  // Check if we're in demo mode
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

  if (!isDemo || dismissed) {
    return null
  }

  return (
    <Alert className="mx-4 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <strong>Demo Mode:</strong> Configure Supabase integration to enable full functionality.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 ml-2"
          >
            ×
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
