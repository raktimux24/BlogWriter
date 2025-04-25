import BrandLogo from "@/components/ui/brand-logo"

interface HeaderProps {
  showTitle?: boolean
  centered?: boolean
  description?: string
}

export default function Header({ showTitle = true, centered = true, description }: HeaderProps) {
  return (
    <div className="stagger-fade-in">
      <div className={`flex ${centered ? "justify-center" : "justify-start"} mb-8`}>
        <BrandLogo className="text-xl" />
      </div>

      {showTitle && (
        <div className={`${centered ? "text-center" : ""} mb-12`}>
          <h1 className="text-animate-gradient mb-4">Blog Writer</h1>
          {description && (
            <p className="text-lg font-light text-emerald-700 dark:text-emerald-300 max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
