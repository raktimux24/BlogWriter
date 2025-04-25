/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // Default n8n webhook URL - can be overridden with environment variables
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'https://makeshifttdesign23.app.n8n.cloud/webhook/02fce493-0834-4ab8-a040-3d23871019a1',
  },
}

export default nextConfig
