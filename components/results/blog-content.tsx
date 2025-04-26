"use client"

import React, { useState, useEffect } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, Info, EyeIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { marked } from "marked"
import sanitizeHtml from "sanitize-html"

interface BlogContentProps {
  blogData: any
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

export default function BlogContent({ blogData }: BlogContentProps) {
  const [copied, setCopied] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(0)
  const [showAllVersions, setShowAllVersions] = useState(false)

  // Debug: Log the received blogData to see its structure
  useEffect(() => {
    console.log("Blog data received:", blogData)
    
    // Handle both old format and new Netlify function format
    const contentData = blogData.data ? blogData.data : blogData;
    
    console.log("Content type:", typeof contentData.content);
    
    // Log the content length
    if (contentData.content) {
      if (typeof contentData.content === 'string') {
        console.log("Content length:", contentData.content.length);
        console.log("Content first 100 chars:", contentData.content.substring(0, 100));
        console.log("Content last 100 chars:", 
          contentData.content.substring(
            Math.max(0, contentData.content.length - 100), 
            contentData.content.length
          )
        );
      } else if (typeof contentData.content === 'object') {
        console.log("Content is an object with keys:", Object.keys(contentData.content));
        console.log("Content structure:", JSON.stringify(contentData.content, null, 2));
      } else {
        console.log("Content preview:", contentData.content);
      }
    }
    
    // Deep inspection of allOutputs
    if (contentData.allOutputs && Array.isArray(contentData.allOutputs)) {
      console.log("allOutputs length:", contentData.allOutputs.length);
      contentData.allOutputs.forEach((output: any, i: number) => {
        console.log(`Output ${i} type:`, typeof output);
        if (typeof output === 'string') {
          console.log(`Output ${i} length:`, output.length);
        } else if (typeof output === 'object') {
          console.log(`Output ${i} structure:`, JSON.stringify(output, null, 2));
        }
      });
    }
    
    // Additional debug - check the structure of rawResponse if it exists
    if (contentData.rawResponse) {
      console.log("Raw response length:", contentData.rawResponse.length);
      try {
        // First try to parse as normal JSON
        const parsedRaw = JSON.parse(contentData.rawResponse);
        console.log("Parsed raw response:", parsedRaw);
      } catch (e) {
        console.log("Couldn't parse raw response as JSON");
        
        // Try to extract content from n8n format if normal parsing fails
        try {
          // Look for n8n pattern: "Output X": "content"
          const outputMatch = contentData.rawResponse.match(/"Output \d+":\s*"([\s\S]+?)(?:"\s*}|\s*,\s*")/);
          if (outputMatch && outputMatch[1]) {
            console.log("Found n8n output pattern in raw response");
            const extractedContent = outputMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log("Extracted content length:", extractedContent.length);
            console.log("Extracted content first 100 chars:", extractedContent.substring(0, 100) + "...");
            console.log("Extracted content last 100 chars:", 
              extractedContent.substring(
                Math.max(0, extractedContent.length - 100), 
                extractedContent.length
              )
            );
          }
        } catch (extractError) {
          console.log("Failed to extract content from non-JSON response");
        }
      }
    }
  }, [blogData])

  // Extract title, content and any alternative outputs
  // Handle both old format and new Netlify function format
  const contentData = blogData.data ? blogData.data : blogData;
  const title = contentData.title || "Generated Blog Post"
  
  // Make sure we have valid content - force string conversion if needed
  let content = '';
  if (typeof contentData.content === 'string') {
    content = contentData.content;
  } else if (contentData.content) {
    // Convert any non-string content to a formatted string
    content = typeof contentData.content === 'object' 
      ? JSON.stringify(contentData.content, null, 2)
      : String(contentData.content);
    console.log("Converted non-string content to string:", content.substring(0, 100));
  }
  
  // Fix malformed content with "Output 1"
  if (content.includes('Output 1":')) {
    console.log("Fixing malformed content with Output 1 prefix");
    const parts = content.split('Output 1":');
    if (parts.length > 1) {
      content = parts[1].trim()
        .replace(/^"/, '') // Remove leading quote
        .replace(/"$/, '') // Remove trailing quote
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }
  
  // Properly extract alternativeOutputs, ensuring it's an array of strings
  let alternativeOutputs: string[] = []
  if (contentData.allOutputs && Array.isArray(contentData.allOutputs)) {
    alternativeOutputs = contentData.allOutputs
      // Convert each item to a string if it's not already
      .map((output: any) => {
        if (typeof output === 'string') {
          return output;
        } else if (output) {
          return typeof output === 'object' 
            ? JSON.stringify(output, null, 2)
            : String(output);
        }
        return '';
      })
      // Filter out empty strings
      .filter((output: string) => output.trim() !== '')
      // Clean up each alternative output if needed
      .map((output: string) => {
        if (output.includes('Output 1":')) {
          const parts = output.split('Output 1":');
          if (parts.length > 1) {
            return parts[1].trim()
              .replace(/^"/, '')
              .replace(/"$/, '')
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        }
        return output;
      });
  }
  
  // Determine if we have multiple versions
  const hasAlternatives = alternativeOutputs.length > 1
  
  // Get the currently selected content (either main content or an alternative)
  const selectedContent = selectedVersion === 0 
    ? content 
    : (alternativeOutputs[selectedVersion - 1] || content)
  
  // Debug log to check the content structure
  console.log("Content type:", typeof selectedContent);
  console.log("Content preview:", typeof selectedContent === 'string' 
    ? selectedContent.substring(0, 100) 
    : JSON.stringify(selectedContent).substring(0, 100));
  
  // Ensure content is a string
  let contentString = typeof selectedContent === 'string' 
    ? selectedContent 
    : JSON.stringify(selectedContent);
    
  // If we have multiple outputs, display them separated
  const allContent = hasAlternatives && alternativeOutputs.length > 0 ? 
    [content, ...alternativeOutputs.map(output => typeof output === 'string' ? output : JSON.stringify(output))] : 
    [contentString];
  
  // Check if content begins with ** which indicates bold instead of proper markdown headings
  if (contentString.trim().startsWith('**') && !contentString.includes('# ')) {
    console.log("Content starts with bold (**) rather than proper headings, applying fix");
    
    // Try to extract a title from the first bold section
    const boldTitleMatch = contentString.match(/^\*\*([^*]+)\*\*/);
    if (boldTitleMatch && boldTitleMatch[1]) {
      const extractedTitle = boldTitleMatch[1].trim();
      // Convert the first bold section to a heading and add proper markdown structure
      contentString = contentString.replace(/^\*\*([^*]+)\*\*/, `# ${boldTitleMatch[1]}`);
      console.log("Fixed content by converting first bold to heading");
    }
  }
  
  // Determine if content is HTML, markdown, or plain text
  const isHtml = typeof contentString === 'string' && 
    contentString.trim().startsWith('<') && 
    contentString.includes('</');
    
  const isMarkdown = !isHtml && typeof contentString === 'string' && (
    contentString.includes('# ') || 
    contentString.includes('## ') || 
    contentString.includes('**') || 
    contentString.includes('__') ||
    contentString.includes('- ') ||
    contentString.includes('1. ') ||
    contentString.includes('\n\n') ||  // Multiple paragraphs
    contentString.includes('*') ||     // Italics or lists
    contentString.includes('[') && contentString.includes('](') // Links
  );

  // Format the content appropriately based on type
  const formatContent = (
    content: string,
    showSeparator: boolean = false
  ): React.ReactNode => {
    if (!content) return null;
    
    console.log("Formatting content of type:", typeof content);
    console.log("Content preview:", content.substring(0, 50));
    
    let formattedContent: React.ReactNode;
    
    try {
      // For HTML content
      if (isHtml) {
        // Apply Tailwind classes to HTML elements
        let formattedHtml = content
          // Style headings
          .replace(/<h1/g, '<h1 class="text-3xl font-bold mb-6 mt-8"')
          .replace(/<h2/g, '<h2 class="text-2xl font-semibold mb-4 mt-6"')
          .replace(/<h3/g, '<h3 class="text-xl font-medium mb-3 mt-5"')
          .replace(/<h4/g, '<h4 class="text-lg font-medium mb-2 mt-4"')
          
          // Style paragraphs
          .replace(/<p>/g, '<p class="mb-4 text-base leading-relaxed">')
          
          // Style lists
          .replace(/<ul>/g, '<ul class="mb-4 ml-5 list-disc">')
          .replace(/<ol>/g, '<ol class="mb-4 ml-5 list-decimal">')
          .replace(/<li>/g, '<li class="mb-2">')
          
          // Style blockquotes
          .replace(/<blockquote>/g, '<blockquote class="pl-4 border-l-4 border-gray-300 italic my-4">')
          
          // Style code blocks
          .replace(/<pre>/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto mb-4">')
          .replace(/<code>/g, '<code class="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">')
          
          // Style links
          .replace(/<a /g, '<a class="text-blue-600 hover:underline dark:text-blue-400" ');
        
        formattedContent = <div className="space-y-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['class']
          }
        }) }} />;
      }
      
      // For Markdown content
      else if (isMarkdown) {
        console.log("Formatting as markdown, content length:", content.length);
        
        // Use a more basic approach to avoid TypeScript issues with marked.js
        marked.setOptions({
          gfm: true,
          breaks: true,
          pedantic: false,
          silent: false,
        });
        
        try {
          // Parse the markdown to HTML first
          let htmlContent = marked.parse(content) as string;
          console.log("Generated HTML length:", htmlContent.length);
          
          // Then apply Tailwind classes via string replacement, similar to HTML processing
          htmlContent = htmlContent
            // Style headings
            .replace(/<h1/g, '<h1 class="text-3xl font-bold mb-6 mt-8"')
            .replace(/<h2/g, '<h2 class="text-2xl font-semibold mb-4 mt-6"')
            .replace(/<h3/g, '<h3 class="text-xl font-medium mb-3 mt-5"')
            .replace(/<h4/g, '<h4 class="text-lg font-medium mb-2 mt-4"')
            
            // Style paragraphs
            .replace(/<p>/g, '<p class="mb-4 text-base leading-relaxed">')
            
            // Style lists
            .replace(/<ul>/g, '<ul class="mb-4 ml-5 list-disc">')
            .replace(/<ol>/g, '<ol class="mb-4 ml-5 list-decimal">')
            .replace(/<li>/g, '<li class="mb-2">')
            
            // Style blockquotes
            .replace(/<blockquote>/g, '<blockquote class="pl-4 border-l-4 border-gray-300 italic my-4">')
            
            // Style code blocks
            .replace(/<pre><code>/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto mb-4"><code class="font-mono text-sm">')
            .replace(/<code>/g, '<code class="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">')
            
            // Style links
            .replace(/<a /g, '<a class="text-blue-600 hover:underline dark:text-blue-400" ');
          
          const sanitized = sanitizeHtml(htmlContent, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
            allowedAttributes: {
              ...sanitizeHtml.defaults.allowedAttributes,
              '*': ['class']
            }
          });
          
          console.log("Sanitized HTML length:", sanitized.length);
          
          formattedContent = <div className="space-y-4" dangerouslySetInnerHTML={{ __html: sanitized }} />;
        } catch (markdownError) {
          console.error("Error parsing markdown:", markdownError);
          
          // If markdown parsing fails, fall back to basic formatting
          formattedContent = (
            <div className="space-y-4">
              {content.split('\n\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-4 text-base leading-relaxed">
                    {paragraph.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < paragraph.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                ) : <div key={index} className="h-4" />
              ))}
            </div>
          );
        }
      }
      
      // For plain text content
      else {
        // Check if content might be JSON (starts with { or [)
        if ((content.trim().startsWith('{') && content.trim().endsWith('}')) || 
            (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
          console.log("Formatting potential JSON content");
          try {
            // Try to parse and pretty print if it's valid JSON
            const parsedJSON = JSON.parse(content);
            formattedContent = (
              <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-900 p-4 rounded-md font-mono text-sm">
                {JSON.stringify(parsedJSON, null, 2)}
              </pre>
            );
          } catch (e) {
            // Not valid JSON, continue with normal text formatting
            console.log("Thought content was JSON but failed to parse");
            formattedContent = null; // Will be set in the next section
          }
        }
        
        // If no special format was applied yet
        if (!formattedContent) {
          formattedContent = (
            <div className="space-y-4">
              {content.split('\n\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-4 text-base leading-relaxed">
                    {paragraph.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < paragraph.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                ) : <div key={index} className="h-4" />
              ))}
            </div>
          );
        }
      }
    } catch (error) {
      console.error("Error formatting content:", error);
      
      // Fallback to simple pre-formatted text
      formattedContent = (
        <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          {content}
        </pre>
      );
    }
    
    // Add a separator if requested
    if (showSeparator) {
      return (
        <>
          {formattedContent}
          <div className="my-10 border-t-2 border-dashed border-slate-300 dark:border-slate-700 relative">
            <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-950 px-4 text-xs text-slate-500 dark:text-slate-400">
              End of Response
            </span>
          </div>
        </>
      );
    }
    
    return formattedContent;
  };
  
  // Format the selected content for display
  const formattedContent = formatContent(contentString);

  const copyToClipboard = () => {
    // For HTML or markdown content, strip tags for clipboard copy
    let textToCopy = title + "\n\n";
    
    if (isHtml && typeof contentString === 'string') {
      textToCopy += contentString.replace(/<[^>]*>/g, '');
    } else if (contentString) {
      textToCopy += contentString;
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
  
  // Check if we have debug info from the server
  const hasDebugInfo = blogData.debugInfo && typeof blogData.debugInfo === 'object';

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
          {blogData.metadata.responseFormat && (
            <p>Response format: {blogData.metadata.responseFormat}</p>
          )}
        </div>
      )}
      
      {showRawData && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 dark:bg-slate-900/30 dark:border-slate-800 my-4 overflow-hidden">
          <div className="font-mono text-xs overflow-auto max-h-96">
            {hasDebugInfo && (
              <>
                <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Debug Information:</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-4">
                  {blogData.debugInfo.responseFormat && (
                    <p><span className="font-semibold">Response Format:</span> {blogData.debugInfo.responseFormat}</p>
                  )}
                  {blogData.debugInfo.contentSource && (
                    <p><span className="font-semibold">Content Source:</span> {blogData.debugInfo.contentSource}</p>
                  )}
                  {blogData.debugInfo.foundKeys && blogData.debugInfo.foundKeys.length > 0 && (
                    <p><span className="font-semibold">Found Keys:</span> {blogData.debugInfo.foundKeys.join(', ')}</p>
                  )}
                  {blogData.debugInfo.processingSteps && blogData.debugInfo.processingSteps.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Processing Steps:</p>
                      <ol className="list-decimal pl-5 mt-1">
                        {blogData.debugInfo.processingSteps.map((step: string, index: number) => (
                          <li key={index} className="text-xs">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <h4 className="font-medium mb-2">Raw Response:</h4>
            {blogData.rawResponse ? (
              <>
                <pre className="whitespace-pre-wrap break-words">{blogData.rawResponse}</pre>
                
                {/* Try to show a cleaned-up version if it contains "Output X" format */}
                {blogData.rawResponse.includes('"Output') && (
                  <div className="mt-4 border-t pt-2 border-slate-300 dark:border-slate-700">
                    <h5 className="text-xs font-medium mb-2 text-emerald-700 dark:text-emerald-500">
                      Cleaned Output Content:
                    </h5>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
                      {(() => {
                        try {
                          // Look for n8n output pattern and extract
                          const match = blogData.rawResponse.match(/"Output \d+":\s*"([\s\S]+?)(?:"\s*}|\s*,\s*")/);
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

      <div className="pt-4">
        {selectedContent ? (
          <div className="mb-6">
            {showAllVersions ? (
              <div className="space-y-12">
                {allContent.map((contentItem, index) => (
                  <div key={index}>
                    {index > 0 && (
                      <div className="mb-6 mt-6 flex items-center">
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                        <div className="mx-4 px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium">
                          Version {index + 1}
                        </div>
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                      </div>
                    )}
                    <div className="space-y-4">
                      {formatContent(
                        typeof contentItem === 'string' ? contentItem : JSON.stringify(contentItem),
                        index < allContent.length - 1 // Add separator for all but the last item
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {formatContent(typeof selectedContent === 'string' ? selectedContent : JSON.stringify(selectedContent))}
              </div>
            )}
          </div>
        ) : (
          <ContentSkeleton />
        )}
      </div>
      
      {allContent.length > 1 && (
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
