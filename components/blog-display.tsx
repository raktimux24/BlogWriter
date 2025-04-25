"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogDisplayProps {
  blogData: any
}

export default function BlogDisplay({ blogData }: BlogDisplayProps) {
  const [copied, setCopied] = useState(false)

  // Extract title and content from the response
  // This assumes the n8n webhook returns data in a specific format
  // Adjust according to the actual response structure
  const title = blogData.title || "Generated Blog Post"
  const content = blogData.content || ""

  // Format the content by replacing newlines with paragraph breaks
  const formattedContent = content
    .split("\n\n")
    .filter((paragraph: string) => paragraph.trim() !== "")
    .map((paragraph: string, index: number) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ))

  const copyToClipboard = () => {
    const fullText = `${title}\n\n${content}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 dark:text-emerald-400">{title}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="prose prose-emerald dark:prose-invert max-w-none">{formattedContent}</div>
    </div>
  )
}
