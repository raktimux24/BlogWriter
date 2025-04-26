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
      
      // Check if we have the expected n8n format with "Output X" keys
      const outputKeys = Object.keys(parsedResponseData).filter(key => key.startsWith('Output '));
      
      if (outputKeys.length > 0) {
        // Extract the main content from the first output
        const mainOutputKey = outputKeys[0];
        const rawContent = parsedResponseData[mainOutputKey];
        
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
          const output = parsedResponseData[key];
          return typeof output === 'string' 
            ? output
              .replace(/^#+\s*\n+/, '')
              .replace(/^"/, '')
              .replace(/"$/, '')
            : JSON.stringify(output);
        });
        
        // Use properly formatted data
        parsedResponseData = {
          title: title,
          content: cleanContent,
          allOutputs: allOutputs,
          rawResponse: responseData.data,
          rawData: parsedResponseData,
          metadata: {
            requestTime: new Date().toISOString(),
            source: "BlogWriter App",
            webhookStatus: 'success',
            webhookMessage: 'Successfully processed n8n output format',
            responseStatus: responseData.statusCode,
            responseStatusText: responseData.statusMessage,
            outputCount: allOutputs.length,
            responseFormat: "n8n_output_format"
          }
        };
      } else {
        // If no Output keys, try to use the raw JSON as is
        parsedResponseData = {
          title: "Generated Blog Post",
          content: JSON.stringify(parsedResponseData, null, 2),
          rawResponse: responseData.data,
          rawData: parsedResponseData
        };
      }
    } catch (e) {
      // If not valid JSON, try to extract content from the raw response
      console.log("Error parsing as JSON, trying direct extraction:", e.message);
      
      // Look for n8n output pattern
      const outputMatch = responseData.data.match(/"Output \d+":\s*"([\s\S]+?)(?:"\s*}|\s*,\s*")/);
      if (outputMatch && outputMatch[1]) {
        // Clean the extracted content
        const extractedContent = outputMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        // Extract title from the content if it starts with **
        let title = "Generated Blog Post";
        const titleMatch = extractedContent.match(/^\*\*([^*]+)\*\*/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }
        
        parsedResponseData = {
          title: title,
          content: extractedContent,
          rawResponse: responseData.data,
          outputType: 'extracted_text'
        };
      } else {
        // Fallback if can't extract content
        parsedResponseData = {
          title: "Generated Blog Post",
          content: responseData.data,
          rawResponse: responseData.data,
          outputType: 'raw_text'
        };
      }
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