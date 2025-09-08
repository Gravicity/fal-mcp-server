# Fal.ai MCP Server

An MCP (Model Context Protocol) server that provides seamless integration with Fal.ai's image generation models and workflows.

## Features

- 🎨 **Image Generation** - Access 600+ Fal.ai models including Flux, Stable Diffusion, and more
- 🔄 **Workflow Support** - Run pre-built pipelines like sdxl-sticker
- 🚀 **Streaming** - Real-time progress updates for long-running operations
- 📦 **Simple API** - Unified interface for all models and workflows
- ⚡ **Queue Management** - Built-in status tracking for async operations

## Installation

### Quick Install (npm)

```bash
npm install -g fal-mcp-server
```

### From Source

```bash
git clone https://github.com/yourusername/fal-mcp-server.git
cd fal-mcp-server
npm install
npm run build
npm link
```

## Setup

### 1. Get your Fal.ai API Key

Sign up at [fal.ai](https://fal.ai) and get your API key from the dashboard.

### 2. Add to Claude Code

```bash
claude mcp add fal --env "FAL_KEY=your-api-key-here" -- npx -y fal-mcp-server
```

### 3. Verify Connection

```bash
claude mcp list
```

You should see:
```
fal: npx -y fal-mcp-server - ✓ Connected
```

## Available Tools

### `generate_image`
Generate images using any Fal.ai model.

**Parameters:**
- `prompt` (required): Text description of the image
- `model`: Model ID (default: "fal-ai/flux/schnell")
- `image_size`: "square", "landscape_4_3", or "portrait_3_4"
- `num_images`: 1-4 images
- `seed`: For reproducible generation

**Example:**
```javascript
{
  "prompt": "a cyberpunk cat in neon city",
  "model": "fal-ai/flux/dev",
  "image_size": "landscape_4_3",
  "num_images": 2
}
```

### `run_model`
Run any Fal.ai model with custom parameters.

**Parameters:**
- `model_id` (required): The model endpoint ID
- `input` (required): Model-specific input parameters
- `stream`: Enable streaming for real-time updates

**Example:**
```javascript
{
  "model_id": "fal-ai/stable-diffusion-v3-medium",
  "input": {
    "prompt": "professional portrait photo",
    "negative_prompt": "low quality, blurry"
  }
}
```

### `run_workflow`
Execute Fal.ai workflows (multi-step pipelines).

**Parameters:**
- `workflow_id` (required): The workflow ID
- `input` (required): Workflow input parameters
- `stream`: Stream workflow events

**Example:**
```javascript
{
  "workflow_id": "workflows/fal-ai/sdxl-sticker",
  "input": {
    "prompt": "cute puppy mascot"
  }
}
```

### `list_popular_models`
Get a list of popular Fal.ai models.

### `check_status`
Check the status of an async request.

**Parameters:**
- `request_id` (required): The request ID to check

## Popular Models

- **fal-ai/flux/schnell** - Fastest Flux model (4 steps)
- **fal-ai/flux/dev** - High quality Flux model
- **fal-ai/flux-pro** - Professional Flux model
- **fal-ai/fast-sdxl** - Fast Stable Diffusion XL
- **fal-ai/stable-diffusion-v3-medium** - Latest SD3
- **fal-ai/recraft-v3** - Artistic style generation

## Workflows

- **workflows/fal-ai/sdxl-sticker** - Generate → Remove BG → Sticker

## Usage in Claude Code

Once installed, you can use natural language to interact with Fal.ai:

- "Generate a cyberpunk cityscape using Flux"
- "Create a sticker of a cute robot"
- "Run the sdxl-sticker workflow with a puppy prompt"
- "List available image models"

## Environment Variables

- `FAL_KEY` (required): Your Fal.ai API key

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run watch

# Run locally
FAL_KEY=your-key node dist/index.js
```

## License

MIT

## Contributing

Contributions welcome! Please submit PRs to improve the server.

## Support

- [Fal.ai Documentation](https://docs.fal.ai)
- [MCP Documentation](https://modelcontextprotocol.io)
- [GitHub Issues](https://github.com/yourusername/fal-mcp-server/issues)