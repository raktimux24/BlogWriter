import type { ReactNode } from "react"

interface CardContainerProps {
  children: ReactNode
  className?: string
}

export default function CardContainer({ children, className = "" }: CardContainerProps) {
  return <div className={`modern-card rounded-xl p-6 md:p-8 ${className}`}>{children}</div>
}
