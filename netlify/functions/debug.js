exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Create a sanitized environment object without sensitive values
    const sanitizedEnv = {};
    for (const key in process.env) {
      // Avoid exposing sensitive values
      if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD')) {
        sanitizedEnv[key] = '[REDACTED]';
      } else {
        sanitizedEnv[key] = process.env[key];
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug information',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        functionName: context.functionName,
        netlify: {
          dev: process.env.NETLIFY_DEV || false,
          deployContext: process.env.CONTEXT || 'unknown',
          site: process.env.SITE_NAME || 'unknown',
          buildId: process.env.BUILD_ID || 'unknown',
        },
        environment: sanitizedEnv,
        hasWebhookUrl: !!process.env.N8N_WEBHOOK_URL,
        event: {
          httpMethod: event.httpMethod,
          path: event.path,
          headers: event.headers
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 