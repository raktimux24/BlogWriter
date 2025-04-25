# Blog Writer

A Next.js application that generates blog posts from URLs using webhooks and AI processing.

## Features

- Generate blog content from one or more URLs
- Support for various response formats from webhooks
- Markdown and HTML content rendering
- Multiple blog version support
- Robust error handling

## Tech Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Server Actions for API functionality

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/raktimux24/BlogWriter.git
cd BlogWriter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```
N8N_WEBHOOK_URL=your_webhook_url_here
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

The app accepts URLs as input, sends them to a webhook for processing, and displays the generated blog post. It includes robust handling for various response formats and error conditions.

## License

[MIT](https://choosealicense.com/licenses/mit/) 