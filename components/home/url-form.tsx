"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateBlogPost } from "@/lib/actions"
import ProgressIndicator from "@/components/ui/progress-indicator"

export default function UrlForm() {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([""])
  const [isLoading, setIsLoading] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progressStage, setProgressStage] = useState<string>("Preparing request")

  // Update progress message based on time elapsed
  useEffect(() => {
    if (!isLoading) return
    
    const stages = [
      { time: 0, message: "Sending request to n8n webhook..." },
      { time: 2000, message: "Reading provided URLs..." },
      { time: 4000, message: "Extracting content from pages..." },
      { time: 6000, message: "Analyzing content structure..." },
      { time: 8000, message: "Generating blog post..." },
      { time: 10000, message: "Formatting response..." },
    ]
    
    // Set up timers for each stage of the progress
    const timers = stages.map(stage => 
      setTimeout(() => {
        if (isLoading) {
          setProgressStage(stage.message)
        }
      }, stage.time)
    )
    
    return () => {
      // Clear all timers on cleanup
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [isLoading])

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
    setWebhookStatus('sending')
    setProgressStage("Sending request to n8n webhook...")

    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.trim() !== "")

    if (validUrls.length === 0) {
      setError("Please enter at least one URL")
      setWebhookStatus('error')
      return
    }

    try {
      setIsLoading(true)
      
      // Log that we're sending data to n8n webhook
      console.log("Sending URLs to n8n webhook:", validUrls)
      
      // Try the primary function endpoint first
      let response;
      let functionError: Error | null = null;
      
      try {
        // Try ES module version first
        response = await fetch('/.netlify/functions/generate-blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ urls: validUrls }),
        });
      } catch (err: any) {
        console.warn("Error calling primary function, trying fallback:", err);
        functionError = err instanceof Error ? err : new Error(String(err));
        
        // Try CommonJS version as fallback
        try {
          response = await fetch('/.netlify/functions/generate-blog-cjs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls: validUrls }),
          });
          functionError = null;
        } catch (fallbackErr: any) {
          console.error("Error calling fallback function too:", fallbackErr);
          throw new Error(`Failed to call Netlify functions: ${
            fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          }. Original error: ${functionError?.message || 'Unknown error'}`);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Error from Netlify function: ${response?.status || 'No response'} ${response?.statusText || ''}`);
      }
      
      const blogData = await response.json();
      
      // Mark webhook as successfully triggered
      setWebhookStatus('success')

      // Store the blog data in sessionStorage
      sessionStorage.setItem("blogData", JSON.stringify(blogData.data || blogData))

      // Navigate to results page
      router.push("/results")
    } catch (err: any) {
      console.error("Error generating blog post:", err)
      setError(`Failed to generate blog post: ${
        err instanceof Error ? err.message : String(err)
      }`)
      setWebhookStatus('error')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 stagger-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
            Enter up to three URLs
          </h2>
          {urls.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addUrlField}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 dark:hover:text-emerald-300 transition-all duration-200"
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
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {urls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeUrlField(index)}
                className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <ProgressIndicator 
            isActive={isLoading} 
            completionTime={10000} 
            className="mb-2"
          />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center">
            {progressStage}
          </p>
        </div>
      )}

      {webhookStatus === 'success' && (
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800">
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">
            Successfully sent data to n8n webhook. Generating your blog post...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
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
