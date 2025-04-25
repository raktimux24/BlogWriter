import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  text?: string
  size?: "sm" | "md" | "lg"
}

export default function LoadingSpinner({ text = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-4 text-emerald-600 dark:text-emerald-400`} />
      <p className="text-emerald-600 dark:text-emerald-400">{text}</p>
    </div>
  )
}
