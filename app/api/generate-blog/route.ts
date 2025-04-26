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
    
    // Make the request to n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.text();
    
    // Return the result
    return NextResponse.json({
      success: true,
      data: {
        title: "Generated Blog Post",
        content: responseData,
        metadata: {
          requestTime: new Date().toISOString(),
          source: "BlogWriter API Route",
          responseStatus: response.status,
          responseStatusText: response.statusText
        }
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