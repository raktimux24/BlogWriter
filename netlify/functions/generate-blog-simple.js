const https = require('https');

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
    
    // Debug: Log environment variables
    console.log("Function environment:", {
      NODE_ENV: process.env.NODE_ENV,
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ? "Set (Hidden for security)" : "Not set",
      NODE_VERSION: process.version,
      FUNCTION_NAME: context.functionName,
      NETLIFY_DEV: process.env.NETLIFY_DEV
    });
    
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
    
    // Using native https module instead of fetch
    const responseData = await new Promise((resolve, reject) => {
      // Parse the webhook URL to get hostname, path, etc.
      const urlParts = new URL(n8nWebhookUrl);
      
      // Prepare request options
      const options = {
        hostname: urlParts.hostname,
        port: 443,
        path: urlParts.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // The whole response has been received
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: data,
            headers: res.headers
          });
        });
      });
      
      // Handle errors
      req.on('error', (error) => {
        console.error('Error making webhook request:', error.message);
        reject(error);
      });
      
      // Write data to request body
      req.write(JSON.stringify(payload));
      req.end();
    });
    
    let parsedResponseData;
    try {
      // Try to parse as JSON
      parsedResponseData = JSON.parse(responseData.data);
    } catch (e) {
      // If not valid JSON, use the raw text
      parsedResponseData = {
        rawResponse: responseData.data,
        outputType: 'raw_text'
      };
    }
    
    // Return the result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedResponseData,
        metadata: {
          requestTime: new Date().toISOString(),
          source: "BlogWriter Netlify Function",
          responseStatus: responseData.statusCode,
          responseStatusText: responseData.statusMessage
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