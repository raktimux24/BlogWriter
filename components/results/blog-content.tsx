"use client"

import React, { useState, useEffect } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { marked } from "marked"

interface BlogContentProps {
  blogData: any
}

export default function BlogContent({ blogData }: BlogContentProps) {
  const [copied, setCopied] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(0)

  // Debug: Log the received blogData to see its structure
  useEffect(() => {
    console.log("Blog data received:", blogData)
    
    // Additional debug - check the structure of rawResponse if it exists
    if (blogData.rawResponse) {
      try {
        const parsedRaw = JSON.parse(blogData.rawResponse);
        console.log("Parsed raw response:", parsedRaw);
      } catch (e) {
        console.log("Couldn't parse raw response as JSON");
      }
    }
  }, [blogData])

  // Extract title, content and any alternative outputs
  const title = blogData.title || "Generated Blog Post"
  
  // Make sure we have valid content
  const content = typeof blogData.content === 'string' ? blogData.content : '';
  
  // Properly extract alternativeOutputs, ensuring it's an array
  let alternativeOutputs: string[] = []
  if (blogData.allOutputs && Array.isArray(blogData.allOutputs)) {
    alternativeOutputs = blogData.allOutputs.filter(
      (output: any) => typeof output === 'string' && output.trim() !== ''
    );
  }
  
  // Determine if we have multiple versions
  const hasAlternatives = alternativeOutputs.length > 1
  
  // Get the currently selected content (either main content or an alternative)
  const selectedContent = selectedVersion === 0 
    ? content 
    : (alternativeOutputs[selectedVersion - 1] || content)
  
  // Determine if content is HTML, markdown, or plain text
  const isHtml = typeof selectedContent === 'string' && 
    selectedContent.trim().startsWith('<') && 
    selectedContent.includes('</');
    
  const isMarkdown = !isHtml && typeof selectedContent === 'string' && (
    selectedContent.includes('# ') || 
    selectedContent.includes('## ') || 
    selectedContent.includes('**') || 
    selectedContent.includes('__') ||
    selectedContent.includes('- ') ||
    selectedContent.includes('1. ')
  );

  // Format the content appropriately based on type
  const formatContent = (contentStr: string) => {
    if (!contentStr || typeof contentStr !== 'string') {
      return <p className="text-red-500">No content to display</p>;
    }
    
    if (isHtml) {
      // If it's HTML, render it directly
      return <div dangerouslySetInnerHTML={{ __html: contentStr }} />;
    } else if (isMarkdown) {
      // If it's markdown, convert to HTML first
      try {
        const htmlContent = marked.parse(contentStr);
        return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
      } catch (error) {
        console.error("Error parsing markdown:", error);
        return formatPlainText(contentStr);
      }
    } else {
      // If it's plain text, format with paragraph breaks
      return formatPlainText(contentStr);
    }
  };
  
  // Format plain text with paragraph breaks
  const formatPlainText = (text: string) => {
    if (!text) return <p>No content to display</p>;
    
    return text
      .split("\n\n")
      .filter((paragraph: string) => paragraph.trim() !== "")
      .map((paragraph: string, index: number) => (
        <p key={index} className="mb-4 text-base md:text-lg font-light leading-relaxed">
          {paragraph}
        </p>
      ));
  };

  // Format the selected content for display
  const formattedContent = formatContent(selectedContent);

  const copyToClipboard = () => {
    // For HTML or markdown content, strip tags for clipboard copy
    let textToCopy = title + "\n\n";
    
    if (isHtml && typeof selectedContent === 'string') {
      textToCopy += selectedContent.replace(/<[^>]*>/g, '');
    } else if (selectedContent) {
      textToCopy += selectedContent;
    }
    
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Select a specific version of the content
  const selectVersion = (index: number) => {
    setSelectedVersion(index);
    setShowAlternatives(false);
  };

  // Check if there was an error or if we have the default content
  const hasError = blogData.metadata?.webhookStatus === 'error' || blogData.metadata?.webhookStatus === 'warning';
  const isDefaultContent = content.includes('<h1>Blog Post Generated</h1>') && content.includes('Submitted URLs:');

  // Display any additional metadata information if available
  const hasAdditionalInfo = blogData.metadata && 
    (blogData.metadata.requestTime || blogData.metadata.source);
    
  // Check if there's a webhookResponse field - this would be the raw response
  const hasRawResponse = blogData.rawResponse || blogData.rawData;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-animate-gradient">{title}</h1>
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
            {blogData.metadata?.webhookMessage || "There was an error processing your request."}
          </AlertDescription>
        </Alert>
      )}

      {hasAdditionalInfo && (
        <div className="text-sm text-slate-500 dark:text-slate-400 italic">
          {blogData.metadata.source && (
            <p>Source: {blogData.metadata.source}</p>
          )}
          {blogData.metadata.requestTime && (
            <p>Generated: {new Date(blogData.metadata.requestTime).toLocaleString()}</p>
          )}
          {blogData.metadata.outputCount > 1 && (
            <p>Multiple versions available ({blogData.metadata.outputCount})</p>
          )}
        </div>
      )}
      
      {showRawData && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 dark:bg-slate-900/30 dark:border-slate-800 my-4 overflow-hidden">
          <div className="font-mono text-xs overflow-auto max-h-96">
            <h4 className="font-medium mb-2">Raw Response:</h4>
            {blogData.rawResponse ? (
              <pre className="whitespace-pre-wrap break-words">{blogData.rawResponse}</pre>
            ) : (
              <p>No raw response data available</p>
            )}
            
            <h4 className="font-medium mb-2 mt-4">Parsed Data:</h4>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(blogData.rawData || {}, null, 2)}</pre>
            
            <h4 className="font-medium mb-2 mt-4">Blog Data Structure:</h4>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(blogData, null, 2)}</pre>
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

      {/* Version selector buttons */}
      {hasAlternatives && (
        <div className="flex flex-wrap gap-2 my-4">
          <Button
            variant={selectedVersion === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => selectVersion(0)}
            className="text-sm"
          >
            Main Version
          </Button>
          
          {alternativeOutputs.map((_, index) => (
            <Button
              key={index}
              variant={selectedVersion === index + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => selectVersion(index + 1)}
              className="text-sm"
            >
              Version {index + 2}
            </Button>
          ))}
        </div>
      )}

      <div className="prose prose-emerald dark:prose-invert max-w-none stagger-fade-in">
        {formattedContent}
      </div>
      
      {hasAlternatives && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-8">
          <Button
            variant="ghost"
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 w-full justify-between"
          >
            <span>All Versions ({alternativeOutputs.length + 1})</span>
            {showAlternatives ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {showAlternatives && (
            <div className="mt-4 space-y-8">
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Main Version</h3>
                <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none">
                  {formatContent(content)}
                </div>
              </div>
              
              {alternativeOutputs.map((output: string, index: number) => (
                <div key={index} className="border p-4 rounded-md">
                  <h3 className="font-medium mb-2">Version {index + 2}</h3>
                  <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none">
                    {formatContent(output)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
