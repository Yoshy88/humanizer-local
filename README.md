# AI Text Humanizer

A modern web application that rewrites AI-generated text to sound naturally human and detects AI-generated content. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **🤖 AI Text Humanizer** - Rewrites AI-generated text with multiple intensity levels (light, medium, aggressive)
- **📊 AI Detection** - Analyzes text to detect AI-generated patterns and assigns a score
- **⚡ Real-time Processing** - Fast analysis and humanization in seconds
- **🎯 Sentence-level Analysis** - Deep scan with detailed breakdown of detection metrics
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🚀 Vercel Ready** - One-click deployment to Vercel

## Quick Start

### Installation

```bash
npm install
```

### Setup

Create a `.env.local` file with your OpenAI API key:
```
OPENAI_API_KEY=sk_your_api_key_here
NEXT_PUBLIC_OPENAI_AVAILABLE=true
```

Get an API key: https://platform.openai.com/api-keys

### Run

```bash
npm run dev
```

Open http://localhost:3000

## Deploy on Vercel

1. Push to GitHub
2. Go to vercel.com and connect your repo
3. Add environment variable: `OPENAI_API_KEY`
4. Deploy!

## Features

- Text humanization with 3 intensity levels
- AI detection scoring
- Real-time analysis
- Responsive design
- Vercel-ready

See [README.md](README.md) for full documentation.
