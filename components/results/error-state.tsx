"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import CardContainer from "@/components/layout/card-container"

interface ErrorStateProps {
  onBack: () => void
  title?: string
  message?: string
}

export default function ErrorState({
  onBack,
  title = "No Blog Data Found",
  message = "We couldn't find any blog data. Please try generating a new blog post.",
}: ErrorStateProps) {
  return (
    <CardContainer>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-emerald-800 dark:text-emerald-400">{title}</h1>
        <p className="text-emerald-600 dark:text-emerald-300 mb-6">{message}</p>
        <Button
          onClick={onBack}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </CardContainer>
  )
}
