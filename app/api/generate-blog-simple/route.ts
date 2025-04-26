import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const data = await request.json();
    const urls = data.urls || [];
    
    if (!urls.length) {
      return NextResponse.json(
        { error: 'No URLs provided' },
        { status: 400 }
      );
    }
    
    // Get webhook URL from environment variables or use default
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 
      "https://makeshifttdesign23.app.n8n.cloud/webhook/02fce493-0834-4ab8-a040-3d23871019a1";
      
    console.log("Using webhook URL:", n8nWebhookUrl.substring(0, n8nWebhookUrl.indexOf("/webhook")) + "/webhook/***");
    
    // Format URLs as url1, url2, etc. in the body object
    const urlObj: Record<string, string> = {};
    urls.forEach((url: string, index: number) => {
      urlObj[`url${index + 1}`] = url;
    });
    
    // Create the payload
    const payload = {
      "body": {
        ...urlObj,
        "metadata": {
          "requestTime": new Date().toISOString(),
          "requestType": "blog_generation",
          "source": "BlogWriter App API Route"
        }
      }
    };
    
    console.log("Sending payload to webhook:", JSON.stringify(payload, null, 2));
    
    // Make the request to n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.text();
    
    // Check if the response is HTML (likely an error page)
    if (responseData.trim().startsWith('<!DOCTYPE html>') || responseData.trim().startsWith('<html>')) {
      console.error("Received HTML response from webhook. This might indicate an error or authentication issue.");
      
      // Generate a fake blog post for demo purposes
      const demoPost = {
        title: "Neobrutalism in Web Design: Bold, Raw, and Functional",
        content: `# Neobrutalism in Web Design: Bold, Raw, and Functional

## What is Neobrutalism?

Neobrutalism in web design is a modern interpretation of the brutalist architecture movement, characterized by bold colors, raw functionality, and an unpolished aesthetic. It embraces imperfection and prioritizes function over traditional design rules.

## Key Characteristics

1. **High-contrast color schemes**: Vibrant, sometimes clashing colors that create visual interest
2. **Chunky elements**: Large buttons, thick borders, and oversized typography
3. **Raw functionality**: Minimal decoration with emphasis on usability
4. **Deliberate "imperfections"**: Asymmetrical layouts, overlapping elements, and unconventional spacing
5. **Simplified illustrations**: Bold, cartoonish graphics with minimal detail

## Benefits of Neobrutalist Design

- **Memorable user experience**: Stands out from minimalist designs dominating the web
- **Improved accessibility**: High contrast elements benefit many users with visual impairments
- **Honest representation**: Embraces the digital medium without trying to mimic physical materials
- **Faster loading times**: Simplified graphics and minimal effects lead to better performance

## When to Use Neobrutalism

Neobrutalism works particularly well for:
- Creative agencies and portfolios
- Youth-oriented brands
- Projects wanting to make a bold statement
- Websites seeking to stand out from conventional designs

## Design Tips

- Start with a simple grid structure, then intentionally break some rules
- Use high-contrast color combinations, but limit your palette
- Incorporate "imperfect" elements that feel handmade
- Balance the raw aesthetic with good usability practices
- Don't abandon all design principles—maintain hierarchy and readability

## The Future of Neobrutalism

While some see neobrutalism as a passing trend, its influence is likely to have lasting effects on web design. The style represents a reaction against overly polished interfaces and reminds us that digital experiences can be both functional and expressive.

Whether you embrace neobrutalism fully or incorporate elements into a more conventional design, this bold approach offers a refreshing alternative to the homogeneous look of many modern websites.`,
        metadata: {
          source: "Demo content (webhook returned HTML)",
          note: "This is generated demo content as the actual webhook returned HTML"
        }
      };
      
      return NextResponse.json({
        success: true,
        data: demoPost,
        metadata: {
          requestTime: new Date().toISOString(),
          source: "BlogWriter API Route (Demo Data)",
          webhookStatus: 'error',
          webhookMessage: 'Webhook returned HTML instead of JSON. Using demo data instead.',
          responseStatus: response.status,
          responseStatusText: response.statusText,
          htmlResponseReceived: true
        }
      });
    }
    
    let parsedData: any;
    
    try {
      // Try to parse as JSON
      parsedData = JSON.parse(responseData);
      
      // Check if we have the expected n8n format with "Output X" keys
      const outputKeys = Object.keys(parsedData).filter(key => key.startsWith('Output '));
      
      if (outputKeys.length > 0) {
        // Extract the main content from the first output
        const mainOutputKey = outputKeys[0];
        const rawContent = parsedData[mainOutputKey];
        
        // Clean up the content
        let cleanContent = typeof rawContent === 'string' 
          ? rawContent
            .replace(/^#+\s*\n+/, '') // Remove any leading # followed by newlines
            .replace(/^"/, '')        // Remove leading quote
            .replace(/"$/, '')        // Remove trailing quote
          : JSON.stringify(rawContent);
        
        // Extract title from the content if it starts with **
        let title = "Generated Blog Post";
        const titleMatch = cleanContent.match(/^\*\*([^*]+)\*\*/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          // Optionally convert the first bold section to a proper markdown heading
          cleanContent = cleanContent.replace(/^\*\*([^*]+)\*\*/, `# ${titleMatch[1]}`);
        }
        
        // Get all outputs as alternative versions
        const allOutputs = outputKeys.map(key => {
          const output = parsedData[key];
          return typeof output === 'string' 
            ? output
              .replace(/^#+\s*\n+/, '')
              .replace(/^"/, '')
              .replace(/"$/, '')
            : JSON.stringify(output);
        });
        
        // Use properly formatted data
        parsedData = {
          title: title,
          content: cleanContent,
          allOutputs: allOutputs,
          rawResponse: responseData,
          rawData: parsedData,
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
      } else {
        // If no Output keys, try to use the raw JSON as is
        parsedData = {
          title: "Generated Blog Post",
          content: JSON.stringify(parsedData, null, 2),
          rawResponse: responseData,
          rawData: parsedData
        };
      }
    } catch (e) {
      // If not valid JSON, use plain text with proper formatting
      console.log("Error parsing as JSON, using text format:", (e as Error).message);
      
      // Create a simple blog post with the received text
      parsedData = {
        title: "Generated Blog Post",
        content: "# Generated Content\n\n" + responseData,
        rawResponse: responseData,
        outputType: 'plain_text'
      };
    }
    
    // Return the result
    return NextResponse.json({
      success: true,
      data: parsedData,
      metadata: {
        requestTime: new Date().toISOString(),
        source: "BlogWriter API Route",
        responseStatus: response.status,
        responseStatusText: response.statusText
      }
    });
  } catch (error) {
    console.error("Error in API route:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
} 