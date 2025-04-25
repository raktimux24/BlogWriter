"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedBackgroundProps {
  children: React.ReactNode
  className?: string
}

export default function AnimatedBackground({ children, className }: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure animations only run after component is mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-hidden",
        mounted
          ? "bg-gradient-animate"
          : "bg-gradient-to-b from-emerald-50 to-teal-100 dark:from-slate-950 dark:to-emerald-950",
        className,
      )}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      {/* Content with backdrop blur for better readability */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
