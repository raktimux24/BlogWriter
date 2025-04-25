import { Feather } from "lucide-react"

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shadow-md">
        <Feather className="h-5 w-5 text-white" />
      </div>
      <span className="font-bold text-emerald-800 dark:text-emerald-400">BlogWriter</span>
    </div>
  )
}
