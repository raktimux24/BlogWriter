"use client"

import React, { useState, useEffect } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, Info, EyeIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { marked } from "marked"
import sanitizeHtml from "sanitize-html"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Update interface to be more compatible with the page component
interface BlogData {
  title?: string
  content?: string
  allOutputs?: string[]
  rawResponse?: string
  rawData?: any
  outputType?: string
  metadata?: any
  debugInfo?: any
  [key: string]: any
}

interface BlogContentProps {
  data?: BlogData
}

// Component for showing loading state when content is loading
const ContentSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
  </div>
);

export default function BlogContent({ data }: BlogContentProps) {
  const [formattedContent, setFormattedContent] = useState<string>('')
  const [isHtmlContent, setIsHtmlContent] = useState<boolean>(false)
  const [versions, setVersions] = useState<string[]>([])
  const [activeVersion, setActiveVersion] = useState<string>('main')
  const [copied, setCopied] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(0)
  const [showAllVersions, setShowAllVersions] = useState(false)

  useEffect(() => {
    if (!data) return
    
    console.log("Blog data received:", data)
    
    // Check if content is HTML
    const content = data.content || '';
    const isHtml = content.trim().startsWith('<!DOCTYPE html>') || 
                   content.trim().startsWith('<html>');
    
    setIsHtmlContent(isHtml)
    
    // Format content based on type
    console.log("Content type:", typeof content)
    console.log("Content length:", content.length)
    console.log("Content first 100 chars:", content.substring(0, 100))
    console.log("Content last 100 chars:", content.length > 100 ? content.substring(content.length - 100) : content)
    
    // Set up alternative versions if available
    if (data.allOutputs && Array.isArray(data.allOutputs) && data.allOutputs.length > 0) {
      setVersions(['main', ...data.allOutputs.map((_, i) => `Version ${i+1}`)])
    }
    
    // Process the content
    formatContent(content)
      .then(formattedText => {
        setFormattedContent(formattedText);
      })
      .catch(error => {
        console.error("Error formatting content:", error);
        setFormattedContent(`Error formatting content: ${error.message}`);
      });

    // Try to log raw response info
    if (data.rawResponse) {
      console.log("Raw response length:", typeof data.rawResponse === 'string' ? data.rawResponse.length : 'N/A')
      try {
        const parsedResponse = JSON.parse(data.rawResponse)
        console.log("Parsed raw response:", parsedResponse)
      } catch (e) {
        console.log("Couldn't parse raw response as JSON")
      }
    }

    // If we received HTML but have a demo post (special case), show that instead
    if (isHtml && data.metadata?.htmlResponseReceived && content.includes('Neobrutalism in Web Design')) {
      formatContent(content)
        .then(formattedText => {
          setFormattedContent(formattedText);
        })
        .catch(error => {
          console.error("Error formatting content:", error);
        });
    }
  }, [data])
  
  const formatContent = async (content: string): Promise<string> => {
    try {
      if (!content || typeof content !== 'string') {
        console.error('Invalid content provided:', content);
        return "No content provided or content is not a string";
      }
      
      console.log('Raw content received in formatContent:', content.substring(0, 200) + '...');
      
      // Check if content is actually HTML content
      const isHTML = content.startsWith('<!DOCTYPE html>') || content.startsWith('<html');
      if (isHTML) {
        console.log('Content appears to be HTML, not showing raw HTML');
        return "ERROR: Received HTML instead of expected content. This might indicate an error with the webhook or API connection.";
      }
      
      // Check if content appears to be JSON
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        console.log('Content appears to be JSON, attempting to parse');
        
        try {
          // Try to parse as JSON
          let extractedContent = '';
          let jsonContent;
          
          try {
            jsonContent = JSON.parse(content);
          } catch (e) {
            // If direct parsing fails, try to extract the JSON part
            const jsonMatch = content.match(/(\{[\s\S]*\})/);
            if (jsonMatch && jsonMatch[1]) {
              jsonContent = JSON.parse(jsonMatch[1]);
            } else {
              throw e;
            }
          }
          
          console.log('Successfully parsed JSON content:', jsonContent);
          
          // Check for different content key patterns
          // First, check for "Output X" pattern
          const outputKey = Object.keys(jsonContent).find(key => key.startsWith('Output'));
          if (outputKey) {
            console.log('Found "Output X" key:', outputKey);
            extractedContent = jsonContent[outputKey];
          } 
          // Next, check for "content X" pattern
          else if (Object.keys(jsonContent).some(key => key.startsWith('content'))) {
            console.log('Found "content X" keys');
            // Combine all content keys in order
            const contentKeys = Object.keys(jsonContent)
              .filter(key => key.startsWith('content'))
              .sort();
            
            extractedContent = contentKeys.map(key => jsonContent[key]).join('\n\n');
            console.log('Combined content from multiple keys');
          }
          // If no pattern matched, take any string value we can find
          else {
            const stringValues = Object.values(jsonContent)
              .filter(value => typeof value === 'string' && value.length > 100);
            
            if (stringValues.length > 0) {
              console.log('Using largest string value found in JSON');
              extractedContent = stringValues.reduce((a, b) => 
                (a as string).length > (b as string).length ? a : b) as string;
            } else {
              // Last resort - just stringify the whole object
              console.log('No suitable content found, using stringified JSON');
              extractedContent = JSON.stringify(jsonContent, null, 2);
            }
          }
          
          if (extractedContent) {
            // If extractedContent is a string with escaped newlines, clean it
            if (typeof extractedContent === 'string') {
              extractedContent = extractedContent
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            }
            
            console.log('Extracted content sample:', typeof extractedContent === 'string' 
              ? extractedContent.substring(0, 100) + '...' 
              : 'Not a string');
            
            if (typeof extractedContent === 'string') {
              const parsed = marked.parse(extractedContent);
              console.log('Parsed markdown length:', typeof parsed === 'string' ? parsed.length : 'unknown');
              return parsed;
            }
          }
        } catch (e) {
          console.error('Error parsing JSON content:', e);
        }
      }
      
      // Process as regular markdown
      console.log('Processing content as regular markdown');
      return marked.parse(content);
    } catch (error) {
      console.error('Error formatting content:', error);
      return `Error formatting content: ${error instanceof Error ? error.message : String(error)}`;
    }
  };
  
  function switchVersion(version: string) {
    if (!data || !data.allOutputs) return
    
    if (version === 'main') {
      formatContent(data.content || '')
        .then(formattedText => {
          setFormattedContent(formattedText);
        })
        .catch(error => {
          console.error("Error formatting content:", error);
        });
    } else {
      const index = parseInt(version.split(' ')[1]) - 1
      if (data.allOutputs[index]) {
        formatContent(data.allOutputs[index])
          .then(formattedText => {
            setFormattedContent(formattedText);
          })
          .catch(error => {
            console.error("Error formatting content:", error);
          });
      }
    }
    
    setActiveVersion(version)
  }
  
  const copyToClipboard = () => {
    // For HTML or markdown content, strip tags for clipboard copy
    let textToCopy = data?.title || "Generated Blog Post" + "\n\n";
    
    if (isHtmlContent && typeof formattedContent === 'string') {
      textToCopy += formattedContent.replace(/<[^>]*>/g, '');
    } else if (formattedContent) {
      textToCopy += formattedContent;
    }
    
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Check if there was an error or if we have the default content
  const hasError = data?.metadata?.webhookStatus === 'error' || data?.metadata?.webhookStatus === 'warning';
  const isDefaultContent = formattedContent.includes('<h1>Blog Post Generated</h1>') && formattedContent.includes('Submitted URLs:');

  // Display any additional metadata information if available
  const hasAdditionalInfo = data?.metadata && 
    (data.metadata.requestTime || data.metadata.source);
    
  // Check if there's a webhookResponse field - this would be the raw response
  const hasRawResponse = data?.rawResponse || data?.rawData;
  
  // Check if we have debug info from the server
  const hasDebugInfo = data?.debugInfo && typeof data?.debugInfo === 'object';

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-animate-gradient">{data?.title || "Generated Blog Post"}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center gap-1"
          >
            <Info className="h-4 w-4" />
            {showRawData ? 'Hide Data' : 'Debug Data'}
          </Button>
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
      </div>

      {hasError && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {data.metadata?.webhookMessage || "There was an error processing your request."}
          </AlertDescription>
        </Alert>
      )}

      {hasAdditionalInfo && (
        <div className="text-sm text-slate-500 dark:text-slate-400 italic">
          {data?.metadata?.source && (
            <p>Source: {data?.metadata?.source}</p>
          )}
          {data?.metadata?.requestTime && (
            <p>Generated: {new Date(data?.metadata?.requestTime).toLocaleString()}</p>
          )}
          {data?.metadata?.outputCount > 1 && (
            <p>Multiple versions available ({data?.metadata?.outputCount})</p>
          )}
          {data?.metadata?.responseFormat && (
            <p>Response format: {data?.metadata?.responseFormat}</p>
          )}
        </div>
      )}
      
      {showRawData && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 dark:bg-slate-900/30 dark:border-slate-800 my-4 overflow-hidden">
          <div className="font-mono text-xs overflow-auto max-h-96">
            {hasDebugInfo && data?.debugInfo && (
              <>
                <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Debug Information:</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-4">
                  {data?.debugInfo?.responseFormat && (
                    <p><span className="font-semibold">Response Format:</span> {data?.debugInfo?.responseFormat}</p>
                  )}
                  {data?.debugInfo?.contentSource && (
                    <p><span className="font-semibold">Content Source:</span> {data?.debugInfo?.contentSource}</p>
                  )}
                  {data?.debugInfo?.foundKeys && data?.debugInfo?.foundKeys.length > 0 && (
                    <p><span className="font-semibold">Found Keys:</span> {data?.debugInfo?.foundKeys.join(', ')}</p>
                  )}
                  {data?.debugInfo?.processingSteps && data?.debugInfo?.processingSteps.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Processing Steps:</p>
                      <ol className="list-decimal pl-5 mt-1">
                        {data?.debugInfo?.processingSteps.map((step: string, index: number) => (
                          <li key={index} className="text-xs">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <h4 className="font-medium mb-2">Raw Response:</h4>
            {data?.rawResponse ? (
              <>
                <pre className="whitespace-pre-wrap break-words">{data?.rawResponse}</pre>
                
                {/* Try to show a cleaned-up version if it contains "Output X" format */}
                {data?.rawResponse?.includes('"Output') && (
                  <div className="mt-4 border-t pt-2 border-slate-300 dark:border-slate-700">
                    <h5 className="text-xs font-medium mb-2 text-emerald-700 dark:text-emerald-500">
                      Cleaned Output Content:
                    </h5>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
                      {(() => {
                        try {
                          // Look for n8n output pattern and extract
                          const match = data?.rawResponse?.match(/"Output \d+":\s*"([\s\S]+?)(?:"\s*}|\s*,\s*")/);
                          if (match && match[1]) {
                            const cleaned = match[1]
                              .replace(/\\n/g, '\n')
                              .replace(/\\"/g, '"')
                              .replace(/\\\\/g, '\\');
                            return (
                              <pre className="whitespace-pre-wrap break-words text-xs">
                                {cleaned}
                              </pre>
                            );
                          }
                          return <p className="text-xs">Could not extract clean content</p>;
                        } catch (e) {
                          return <p className="text-xs">Error processing output format</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>No raw response data available</p>
            )}
            
            <h4 className="font-medium mb-2 mt-4">Parsed Data:</h4>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data?.rawData || {}, null, 2)}</pre>
            
            <h4 className="font-medium mb-2 mt-4">Blog Data Structure:</h4>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data || {}, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Display warning for default content */}
      {isDefaultContent && !hasError && (
        <Alert className="my-4 bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The webhook response couldn't be processed correctly. Check the Debug Data for more information.
          </AlertDescription>
        </Alert>
      )}

      {versions.length > 1 ? (
        <Tabs defaultValue="main" value={activeVersion} onValueChange={switchVersion} className="mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            {versions.map((v) => (
              <TabsTrigger key={v} value={v} className="text-sm">
                {v}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
      
      <div 
        dangerouslySetInnerHTML={{ __html: formattedContent }} 
        className="blog-content"
      />
      
      {versions.length > 1 && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllVersions(!showAllVersions)}
            className="text-xs flex items-center gap-1"
          >
            {showAllVersions ? (
              <>
                <EyeIcon className="h-3 w-3" />
                Show Selected Version
              </>
            ) : (
              <>
                <LayersIcon className="h-3 w-3" />
                Show All Versions
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
