interface FooterProps {
  text?: string
}

export default function Footer({ text = "Powered by n8n workflows and modern web technologies." }: FooterProps) {
  return (
    <div className="mt-12 text-center text-sm text-emerald-600 dark:text-emerald-500">
      <p>{text}</p>
    </div>
  )
}
