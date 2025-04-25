"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import BrandLogo from "@/components/ui/brand-logo"

interface NavigationBarProps {
  onBack: () => void
}

export default function NavigationBar({ onBack }: NavigationBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 dark:hover:text-emerald-300"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      <BrandLogo />
    </div>
  )
}
