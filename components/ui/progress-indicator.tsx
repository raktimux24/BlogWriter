"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  isActive: boolean
  className?: string
  simulateCompletion?: boolean
  steps?: number
  completionTime?: number
}

export default function ProgressIndicator({
  isActive,
  className,
  simulateCompletion = true,
  steps = 10,
  completionTime = 5000, // 5 seconds by default
}: ProgressIndicatorProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setProgress(0)
      return
    }

    if (simulateCompletion) {
      // For simulated progress, we'll move in steps toward ~90%
      // This gives a visual indication of progress without reaching 100%
      // (since we don't know exactly when the real operation will complete)
      const stepTime = completionTime / steps
      const increment = 90 / steps

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < steps && isActive) {
          currentStep++
          setProgress(Math.min(currentStep * increment, 90))
        } else {
          clearInterval(interval)
        }
      }, stepTime)

      return () => clearInterval(interval)
    }
  }, [isActive, simulateCompletion, steps, completionTime])

  // When isActive becomes false after being true (operation completed)
  // quickly animate to 100% for a satisfying completion
  useEffect(() => {
    if (!isActive && progress > 0) {
      setProgress(100)
    }
  }, [isActive, progress])

  return (
    <div className={cn("w-full transition-opacity duration-300", 
      isActive ? "opacity-100" : "opacity-0",
      className
    )}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <div 
          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
} 