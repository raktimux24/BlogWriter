"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PageContainer from "@/components/layout/page-container"
import CardContainer from "@/components/layout/card-container"
import NavigationBar from "@/components/results/navigation-bar"
import BlogContent from "@/components/results/blog-content"
import LoadingSpinner from "@/components/ui/loading-spinner"
import ProgressIndicator from "@/components/ui/progress-indicator"
import ErrorState from "@/components/results/error-state"
import WebhookStatus from "@/components/results/webhook-status"
import Footer from "@/components/layout/footer"

interface BlogData {
  title?: string
  content?: string
  rawResponse?: string
  rawData?: any
  allOutputs?: string[]
  error?: string
  metadata?: {
    requestTime?: string
    requestType?: string
    source?: string
    webhookStatus?: 'success' | 'error' | 'info'
    webhookMessage?: string
    responseStatus?: number
    responseStatusText?: string
    outputCount?: number
    responseFormat?: string
  }
  [key: string]: any
}

export default function ResultsPage() {
  const router = useRouter()
  const [blogData, setBlogData] = useState<BlogData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<{
    status: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  useEffect(() => {
    // Retrieve blog data from sessionStorage
    const storedData = sessionStorage.getItem("blogData")
    console.log("Retrieved data from sessionStorage", storedData ? true : false)

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        console.log("Parsed blog data:", parsedData)
        setBlogData(parsedData)
        
        // Set webhook info if available
        if (parsedData.metadata) {
          setWebhookInfo({
            status: parsedData.metadata.webhookStatus || 'success',
            message: parsedData.metadata.webhookMessage || 
              `Blog post generated via n8n webhook at ${
                new Date(parsedData.metadata.requestTime || Date.now()).toLocaleTimeString()
              }`
          })
        } else if (parsedData.error) {
          setWebhookInfo({
            status: 'error',
            message: `Error: ${parsedData.error}`
          })
          setError(parsedData.error)
        } else {
          setWebhookInfo({
            status: 'info',
            message: 'Blog post generated via n8n webhook integration'
          })
        }
      } catch (error) {
        console.error("Error parsing blog data:", error)
        setError(`Error parsing webhook response: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setWebhookInfo({
          status: 'error',
          message: 'Error processing webhook response data'
        })
      }
    } else {
      setError("No data found - please try generating a blog post from the home page")
      setWebhookInfo({
        status: 'error',
        message: 'No response data found from n8n webhook'
      })
    }

    setIsLoading(false)
  }, [])

  const handleBack = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center">
        <CardContainer>
          <div className="text-center py-12">
            <LoadingSpinner text="Processing blog content..." size="lg" />
            <div className="mt-8 max-w-md mx-auto">
              <ProgressIndicator 
                isActive={true} 
                completionTime={12000}
                steps={15}
              />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-4">
                Formatting your blog post and preparing content for display...
              </p>
            </div>
          </div>
        </CardContainer>
      </PageContainer>
    )
  }

  if (!blogData) {
    return (
      <PageContainer>
        <ErrorState 
          onBack={handleBack} 
          title="No Blog Data Found"
          message={error || "We couldn't find any blog data. Please try generating a new blog post."}
        />
        <Footer />
      </PageContainer>
    )
  }

  // Check if we have content
  const hasContent = !!blogData.content && typeof blogData.content === 'string' && blogData.content.trim() !== ''
  const hasEmptyContentMessage = !hasContent && blogData.content !== undefined

  return (
    <PageContainer>
      <NavigationBar onBack={handleBack} />

      <CardContainer>
        {webhookInfo && (
          <WebhookStatus 
            status={webhookInfo.status} 
            title={blogData.metadata?.responseStatus ? 
              `Webhook Status: ${blogData.metadata.responseStatus} ${blogData.metadata.responseStatusText || ''}` : 
              "Webhook Status"
            }
            message={webhookInfo.message}
            responseFormat={blogData.metadata?.responseFormat}
            responseStatus={blogData.metadata?.responseStatus}
          />
        )}
        
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6 dark:bg-red-900/30 dark:border-red-800">
            <div className="flex">
              <div className="text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        )}
        
        {hasEmptyContentMessage && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-6 dark:bg-yellow-900/30 dark:border-yellow-800">
            <div className="text-yellow-800 dark:text-yellow-300">
              The webhook was called successfully but no content was returned. Please check the webhook configuration.
            </div>
          </div>
        )}
        
        <BlogContent blogData={blogData} />
      </CardContainer>

      <Footer />
    </PageContainer>
  )
}
