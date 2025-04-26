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
    
    // Get webhook URL from environment variables or use default
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 
      "https://makeshifttdesign23.app.n8n.cloud/webhook/02fce493-0834-4ab8-a040-3d23871019a1";
      
    console.log("Using webhook URL:", n8nWebhookUrl.substring(0, n8nWebhookUrl.indexOf("/webhook")) + "/webhook/***");
    
    // Format URLs as url1, url2, etc. in the body object
    const urlObj = {};
    urls.forEach((url, index) => {
      urlObj[`url${index + 1}`] = url;
    });
    
    // Create the payload
    const payload = {
      "body": {
        ...urlObj,
        "metadata": {
          "requestTime": new Date().toISOString(),
          "requestType": "blog_generation",
          "source": "BlogWriter App Netlify Function"
        }
      }
    };
    
    // Using node-fetch to make the request
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      // If not valid JSON, use raw text
      parsedData = {
        title: "Generated Blog Post",
        content: responseData
      };
    }
    
    // Return the result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedData,
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
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 