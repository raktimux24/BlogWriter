"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateBlogPost } from "@/lib/actions"

export default function UrlForm() {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addUrlField = () => {
    if (urls.length < 3) {
      setUrls([...urls, ""])
    }
  }

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      const newUrls = [...urls]
      newUrls.splice(index, 1)
      setUrls(newUrls)
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.trim() !== "")

    if (validUrls.length === 0) {
      setError("Please enter at least one URL")
      return
    }

    try {
      setIsLoading(true)
      const blogData = await generateBlogPost(validUrls)

      // Store the blog data in sessionStorage
      sessionStorage.setItem("blogData", JSON.stringify(blogData))

      // Navigate to results page
      router.push("/results")
    } catch (err) {
      console.error("Error generating blog post:", err)
      setError("Failed to generate blog post. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Enter up to three URLs</h2>
          {urls.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addUrlField}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 dark:hover:text-emerald-300"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          )}
        </div>

        {urls.map((url, index) => (
          <div key={index} className="flex gap-2 items-center">
            <div className="flex-1">
              <Label htmlFor={`url-${index}`} className="sr-only">
                URL {index + 1}
              </Label>
              <Input
                id={`url-${index}`}
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                className="w-full"
              />
            </div>
            {urls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeUrlField(index)}
                className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            Generate Blog Post
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
