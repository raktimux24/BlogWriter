import type { ReactNode } from "react"
import AnimatedBackground from "@/components/ui/animated-background"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <AnimatedBackground className={className}>
      <div className="container max-w-4xl mx-auto px-4 py-12 fade-in">{children}</div>
    </AnimatedBackground>
  )
}
