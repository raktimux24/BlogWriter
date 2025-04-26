const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Make sure it's a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const urls = data.urls || [];
    
    if (!urls.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No URLs provided' })
      };
    }
    
    // Get webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 
      "https://makeshifttdesign23.app.n8n.cloud/webhook/02fce493-0834-4ab8-a040-3d23871019a1";
    
    // Format URLs as url1, url2, etc. in the body object
    const urlObj = {};
    urls.forEach((url, index) => {
      urlObj[`url${index + 1}`] = url;
    });
    
    // Create the payload in the required format
    const payload = {
      "x-forwarded-proto": "https",
      "x-forwarded-server": "netlify-serverless-function",
      "x-is-trusted": "yes",
      "params": {},
      "query": {},
      "body": {
        ...urlObj,
        "metadata": {
          "requestTime": new Date().toISOString(),
          "requestType": "blog_generation",
          "source": "BlogWriter App Netlify Function"
        }
      },
      "webhookUrl": n8nWebhookUrl,
      "executionMode": "production"
    };
    
    console.log("Sending data to n8n webhook:", JSON.stringify(payload.body).substring(0, 200) + "...");
    
    // Make the actual request to the n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    
    // Get the response
    const responseText = await response.text();
    let responseData;
    
    try {
      // Try to parse as JSON
      responseData = JSON.parse(responseText);
    } catch (e) {
      // If not valid JSON, return the raw text
      responseData = {
        rawResponse: responseText,
        outputType: 'raw_text'
      };
    }
    
    // Return the result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: responseData,
        metadata: {
          requestTime: new Date().toISOString(),
          source: "BlogWriter Netlify Function",
          responseStatus: response.status,
          responseStatusText: response.statusText
        }
      })
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        metadata: {
          requestTime: new Date().toISOString(),
          webhookStatus: 'error'
        }
      })
    };
  }
}; 