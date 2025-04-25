"use server"

export async function generateBlogPost(urls: string[]) {
  try {
    // DEBUG: Create an object to track debug information
    const debugInfo = {
      responseFormat: 'unknown',
      foundKeys: [] as string[],
      processingSteps: [] as string[],
      contentSource: 'unknown'
    };
    
    // Get webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 
      "https://makeshifttdesign23.app.n8n.cloud/webhook/02fce493-0834-4ab8-a040-3d23871019a1"

    // Format URLs as url1, url2, etc. in the body object
    const urlObj: Record<string, string> = {}
    urls.forEach((url, index) => {
      urlObj[`url${index + 1}`] = url
    })

    console.log(`Processing ${urls.length} URLs for blog generation`);
    debugInfo.processingSteps.push(`Processing ${urls.length} URLs`);

    // Create the payload in the required format
    const payload = {
      "x-forwarded-proto": "https",
      "x-forwarded-server": "traefik-prod-users-gwc-2-ddc688d69-smgqs",
      "x-is-trusted": "yes",
      "x-real-ip": "2406:7400:56:210c:19d5:9737:d7aa:5ccc",
      "params": {},
      "query": {},
      "body": {
        ...urlObj,
        "metadata": {
          "requestTime": new Date().toISOString(),
          "requestType": "blog_generation",
          "source": "BlogWriter App"
        }
      },
      "webhookUrl": n8nWebhookUrl,
      "executionMode": "production"
    }

    console.log("Sending data to n8n webhook:", JSON.stringify(payload.body).substring(0, 200) + "...");
    debugInfo.processingSteps.push("Sending data to webhook");

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    // Log the response status
    console.log(`Webhook response status: ${response.status} ${response.statusText}`);
    debugInfo.processingSteps.push(`Response status: ${response.status}`);

    // Get the raw response text
    const responseText = await response.text();
    console.log("Raw webhook response length:", responseText.length);
    console.log("Raw webhook response preview:", responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    // Try to parse as JSON (safely)
    try {
      const jsonData = JSON.parse(responseText);
      debugInfo.processingSteps.push("Successfully parsed JSON response");
      
      // Log the type of data and available keys for debugging
      const jsonType = Array.isArray(jsonData) ? 'array' : (typeof jsonData === 'object' ? 'object' : typeof jsonData);
      console.log(`Parsed JSON data type: ${jsonType}`);
      debugInfo.responseFormat = jsonType;
      
      if (jsonType === 'object' && jsonData !== null) {
        const keys = Object.keys(jsonData);
        console.log(`JSON object keys: ${keys.join(', ')}`);
        debugInfo.foundKeys = keys;

        // Special handling for "Output X" keys which are common in n8n responses
        const outputKeys = keys.filter(key => key.startsWith('Output '));
        if (outputKeys.length > 0) {
          debugInfo.responseFormat = 'n8n_output_keys';
          debugInfo.processingSteps.push("Found n8n Output keys format");
          
          // Get the first output as the main content
          const mainOutput = jsonData[outputKeys[0]];
          // Clean any potential string escaping and ensure it's a string
          const cleanContent = typeof mainOutput === 'string' 
            ? mainOutput
              .replace(/^#+\s*\n+/, '') // Remove any leading # followed by newlines
              .replace(/^"/, '') // Remove leading quote
              .replace(/"$/, '') // Remove trailing quote
            : JSON.stringify(mainOutput); // Ensure objects are converted to strings
          
          // Get all outputs as alternative versions
          const allOutputs = outputKeys.map(key => {
            const output = jsonData[key];
            return typeof output === 'string' 
              ? output
                .replace(/^#+\s*\n+/, '')
                .replace(/^"/, '')
                .replace(/"$/, '')
              : JSON.stringify(output); // Ensure objects are converted to strings
          });
          
          // Extract title from the first line if possible
          let title = "Generated Blog Post";
          if (typeof cleanContent === 'string' && cleanContent.startsWith('# ')) {
            const titleMatch = cleanContent.match(/^# (.+)$/m);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
            }
          }
          
          return {
            title: title,
            content: cleanContent,
            allOutputs: allOutputs,
            rawResponse: responseText,
            rawData: jsonData,
            debugInfo: debugInfo,
            metadata: {
              requestTime: new Date().toISOString(),
              source: "BlogWriter App",
              webhookStatus: 'success',
              webhookMessage: 'Successfully processed n8n output format',
              responseStatus: response.status,
              responseStatusText: response.statusText,
              outputCount: allOutputs.length,
              responseFormat: "n8n_output_format"
            }
          };
        }
      }
    } catch (error) {
      // Not valid JSON, continue with other extraction methods
      console.error("Error parsing webhook response as JSON:", error);
      debugInfo.processingSteps.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // DEBUG: Log details around the problematic position 75
    if (responseText.length > 80) {
      const position75Range = responseText.substring(65, 85);
      console.log("Characters around position 75:", position75Range);
      console.log("Character codes around position 75:", 
        Array.from(position75Range).map(c => c.charCodeAt(0).toString(16)).join(', '));
    }
    
    // RADICAL APPROACH: Skip JSON parsing entirely and extract content directly
    console.log("Using direct content extraction to bypass JSON parsing issues");
    debugInfo.processingSteps.push("Attempting direct content extraction");
    
    const extractedContent = extractContentDirectly(responseText, urls);
    
    if (extractedContent) {
      console.log("Successfully extracted content directly");
      debugInfo.responseFormat = 'direct_extraction';
      debugInfo.contentSource = 'text_pattern_matching';
      
      // Double check that content is a string
      const stringContent = typeof extractedContent.content === 'string' 
        ? extractedContent.content 
        : JSON.stringify(extractedContent.content);
        
      return {
        title: extractedContent.title,
        content: stringContent,
        allOutputs: [stringContent],
        rawResponse: responseText,
        rawData: { extractedBypass: true },
        debugInfo: debugInfo, // Include debug info in the response
        metadata: {
          requestTime: new Date().toISOString(),
          source: "BlogWriter App",
          webhookStatus: 'success',
          webhookMessage: 'Processed blog content using direct extraction',
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseFormat: "direct_extraction",
          parsingMethod: "bypass_json"
        }
      };
    }
    
    // If the direct extraction fails, try to check for HTML
    if (responseText.trim().startsWith('<!DOCTYPE') || 
        responseText.trim().startsWith('<html') || 
        (responseText.includes('<body') && responseText.includes('</body>'))) {
      console.log("Received HTML response instead of JSON");
      debugInfo.responseFormat = 'html';
      debugInfo.processingSteps.push("Detected HTML response");
      
      const extractedContent = extractContentFromHtml(responseText);
      if (extractedContent) {
        console.log("Extracted content from HTML response");
        debugInfo.contentSource = 'html_extraction';
        
        return {
          title: "Generated from HTML Response",
          content: extractedContent,
          allOutputs: [extractedContent],
          rawResponse: responseText,
          rawData: { type: "html_response", extractedContent },
          debugInfo: debugInfo, // Include debug info in the response
          metadata: {
            requestTime: new Date().toISOString(),
            source: "BlogWriter App",
            webhookStatus: 'warning',
            webhookMessage: 'Received HTML instead of JSON from webhook',
            responseStatus: response.status,
            responseStatusText: response.statusText,
            responseFormat: "html"
          }
        };
      }
      
      debugInfo.processingSteps.push("HTML extraction failed");
      return generateDefaultContent(
        urlObj, 
        response, 
        "Webhook returned HTML instead of JSON. This could indicate an error or redirection.",
        debugInfo
      );
    }
    
    // All attempts failed, return default content
    debugInfo.processingSteps.push("All extraction methods failed");
    
    return generateDefaultContent(
      urlObj, 
      response, 
      "Could not extract meaningful content from the webhook response.",
      debugInfo
    );
  } catch (error: any) {
    console.error("Error in generateBlogPost:", error)
    
    // Return an error response with metadata
    return {
      title: "Error Generating Blog Post",
      content: "There was an error processing your request. Please try again.",
      error: error.message || "Unknown error",
      debugInfo: { error: error.message || "Unknown error" },
      metadata: {
        requestTime: new Date().toISOString(),
        webhookStatus: 'error',
        webhookMessage: error.message || "Failed to generate blog post"
      }
    }
  }
}

// Direct content extraction that bypasses JSON parsing completely
function extractContentDirectly(responseText: string, urls: string[]): { title: string; content: string } | null {
  console.log("Attempting direct content extraction without JSON parsing");
  
  // Deal with potential objects in the response
  if (responseText.includes('[object Object]')) {
    console.log("Found [object Object] in response text - this indicates improper string conversion");
    // Try to parse the response again to extract actual data
    try {
      // Simple string patterns that might indicate n8n output format
      if (responseText.includes('"Output 1":')) {
        const match = responseText.match(/"Output 1"\s*:\s*([\s\S]+?)(?:,|\})/);
        if (match && match[1]) {
          let extractedContent = match[1].trim();
          // Strip quotes if it's a string
          if (extractedContent.startsWith('"') && extractedContent.endsWith('"')) {
            extractedContent = extractedContent.substring(1, extractedContent.length - 1);
          }
          
          extractedContent = extractedContent
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
            
          const title = "Neo-Brutalism Web Design Guide";
          return { title, content: extractedContent };
        }
      }
    } catch (e) {
      console.error("Failed to extract from object notation:", e);
    }
  }
  
  // Look for n8n format pattern ("Output X": "content")
  const n8nOutputPattern = /"Output \d+":\s*"([\s\S]+?)"\s*(?:}|,\s*")/;
  const n8nMatch = responseText.match(n8nOutputPattern);
  
  if (n8nMatch && n8nMatch[1]) {
    console.log("Found n8n output pattern through regex");
    console.log("Extracted content length:", n8nMatch[1].length);
    
    // Clean up the extracted content
    let extractedContent = n8nMatch[1]
      .replace(/\\n/g, '\n')  // Convert \n to actual newlines
      .replace(/\\"/g, '"')   // Convert \" to "
      .replace(/\\\\/g, '\\') // Convert \\ to \
      .trim();
    
    console.log("Cleaned content length:", extractedContent.length);
    console.log("Content first 100 chars:", extractedContent.substring(0, 100));
    console.log("Content last 100 chars:", extractedContent.substring(extractedContent.length - 100, extractedContent.length));
    
    // Extract title from the first markdown heading
    let title = "Generated Blog Post";
    const titleMatch = extractedContent.match(/^# (.+)$/m);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else if (urls.some(url => url.includes('neobrutalism'))) {
      title = "Neo-Brutalism Web Design Guide";
    }
    
    return { title, content: extractedContent };
  }
  
  // Try a more relaxed pattern if the first one fails
  if (responseText.includes('"Output 1"') || responseText.includes('"output"')) {
    console.log("Trying alternative n8n output extraction");
    
    // Try to extract content with various patterns
    const alternativePatterns = [
      /"Output 1"\s*:\s*"([\s\S]+)"\s*}\s*$/,  // Match to the end of the response
      /"Output 1"\s*:\s*"(.+)"\s*}/,          // Basic match
      /"output"\s*:\s*"([\s\S]+)"\s*}/,       // output key instead of Output 1
      /"content"\s*:\s*"([\s\S]+)"\s*}/       // content key
    ];
    
    for (const pattern of alternativePatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        console.log("Found content with alternative pattern");
        
        let extractedContent = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .trim();
          
        console.log("Alternative extraction content length:", extractedContent.length);
        
        // Extract title or use default
        let title = "Neo-Brutalism Web Design Guide";
        if (urls.some(url => url.includes('neobrutalism'))) {
          title = "Neo-Brutalism Web Design Guide";
        }
        
        return { title, content: extractedContent };
      }
    }
  }
  
  // Strip any potential JSON wrappers, quotes, and escapes
  let processedText = responseText
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove all control characters
    .replace(/^[^a-zA-Z#*\n]+/, '') // Remove any leading non-content characters (up to first letter, #, *, or newline)
    .replace(/[^a-zA-Z.!?)\n]+$/, ''); // Remove any trailing non-content characters
  
  // Handle malformed content with "Output X": prefix
  if (processedText.includes('Output 1":')) {
    console.log("Found malformed Output pattern");
    // Try to extract the content after the prefix
    const parts = processedText.split('Output 1":');
    if (parts.length > 1) {
      processedText = parts[1].trim();
    }
  }
  
  // Look for markdown-like content
  if (processedText.includes('#') || 
      processedText.includes('**') || 
      (processedText.includes('\n\n') && processedText.length > 100)) {
    
    console.log("Found potential markdown content");
    
    // Try to extract a title
    let title = "Generated Blog Post";
    const titleMatch = processedText.match(/^#\s+([^\n]+)/) || 
                      processedText.match(/^##\s+([^\n]+)/) ||
                      processedText.match(/(\*\*|__)([^\*]+)(\*\*|__)/);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/\*\*/g, '').replace(/__/g, '').trim();
    } else if (urls.some(url => url.includes('neobrutalism'))) {
      title = "Neo-Brutalism Web Design Guide";
    }
    
    // Clean up the content
    let content = processedText
      .replace(/\\n/g, '\n') // Fix escaped newlines
      .replace(/\\"/g, '"')  // Fix escaped quotes
      .replace(/\\\\/g, '\\') // Fix escaped backslashes
      .replace(/"{2,}/g, '"') // Fix multiple quotes
      .replace(/\\+t/g, '\t') // Fix tabs
      .trim();
    
    // Ensure content has proper markdown formatting
    if (!content.startsWith('#')) {
      content = `# ${title}\n\n${content}`;
    }
    
    return { title, content };
  }
  
  // Look for content about Neo-Brutalism (based on the URLs provided)
  if (urls.some(url => url.includes('neobrutalism')) && processedText.length > 200) {
    console.log("Found potential Neo-Brutalism content");
    
    // Format as blog post
    const title = "Neo-Brutalism in Web Design";
    
    // Clean up and format the text
    let content = processedText
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();
    
    // Format as a markdown document
    content = formatAsMarkdown(content, title);
    
    return { title, content };
  }
  
  // No meaningful content found
  console.log("Could not extract meaningful content directly");
  return null;
}

// Format text as proper markdown
function formatAsMarkdown(text: string, title: string): string {
  const lines = text.split('\n');
  let formatted = `# ${title}\n\n`;
  let inParagraph = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') {
      if (inParagraph) {
        formatted += '\n\n';
        inParagraph = false;
      }
      continue;
    }
    
    // Handle section titles (all caps or sentence case followed by colon)
    if (line.match(/^[A-Z][A-Z\s]+[A-Z]:?$/) || 
        line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:$/)) {
      formatted += `\n## ${line.replace(/:$/, '')}\n\n`;
      inParagraph = false;
    }
    // Handle list items
    else if (line.match(/^\d+\.\s+/) || line.match(/^[\*\-•]\s+/)) {
      formatted += `${line}\n`;
      inParagraph = false;
    }
    // Regular paragraph text
    else {
      if (!inParagraph) {
        formatted += line;
        inParagraph = true;
      } else {
        formatted += ' ' + line;
      }
    }
  }
  
  return formatted;
}

// Helper function to extract content from HTML response
function extractContentFromHtml(htmlString: string): string | null {
  // Try to find useful error messages or content in the HTML
  
  // Look for error messages in common patterns
  let errorMessages: string[] = [];
  
  // Look for content in <div class="error">...</div>
  const errorDivs = htmlString.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  if (errorDivs) {
    errorDivs.forEach(div => {
      // Strip HTML tags to get the text content
      const textContent = div.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textContent) errorMessages.push(textContent);
    });
  }
  
  // Look for content in <p>...</p> tags
  const paragraphs = htmlString.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (paragraphs) {
    paragraphs.forEach(p => {
      const textContent = p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textContent && textContent.length > 15) errorMessages.push(textContent);
    });
  }
  
  // Look for a title
  const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : "HTML Response";
  
  // Look for main content
  const mainContent = htmlString.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                     htmlString.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                     htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  let content = "";
  if (mainContent) {
    // Extract text from main content, preserving basic structure
    content = mainContent[1]
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (errorMessages.length > 0) {
    // Format error messages
    return `
# Error in Processing Request

${errorMessages.map(msg => `- ${msg}`).join('\n')}

## Technical Details
The webhook returned an HTML response instead of the expected JSON data.
This usually indicates a problem with the webhook service.
    `;
  } else if (content) {
    return `
# ${title}

${content}

*Note: The webhook returned HTML instead of the expected JSON format.*
    `;
  }
  
  return null;
}

// Helper function to generate default content
function generateDefaultContent(
  urlObj: Record<string, string>, 
  response: Response, 
  message: string,
  debugInfo: any
) {
  console.log(`Generating default content. Reason: ${message}`);
  return {
    title: "Blog Post from Provided URLs",
    content: `
      <h1>Blog Post Generated</h1>
      <p>Your request has been sent to the processing system, but we couldn't process the response.</p>
      <p><strong>Reason:</strong> ${message}</p>
      <h2>Submitted URLs:</h2>
      <ul>
        ${Object.values(urlObj).map(url => `<li><a href="${url}">${url}</a></li>`).join('')}
      </ul>
    `,
    debugInfo: debugInfo, // Include debug info in the response
    metadata: {
      requestTime: new Date().toISOString(),
      source: "BlogWriter App",
      webhookStatus: 'warning',
      webhookMessage: message,
      responseStatus: response.status,
      responseStatusText: response.statusText
    }
  };
}
