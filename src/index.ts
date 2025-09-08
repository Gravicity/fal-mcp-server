#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fal } from "@fal-ai/client";

// Configure Fal.ai client
const FAL_KEY = process.env.FAL_KEY;
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

// Define schemas for our tools
const GenerateImageSchema = z.object({
  prompt: z.string().describe("Text description of the image to generate"),
  model: z.string().default("fal-ai/flux/schnell").describe("Model to use for generation"),
  image_size: z.enum(["square", "landscape_4_3", "portrait_3_4"]).default("landscape_4_3").optional(),
  num_images: z.number().min(1).max(4).default(1).optional(),
  seed: z.number().optional(),
});

const RunModelSchema = z.object({
  model_id: z.string().describe("The Fal.ai model endpoint ID (e.g., 'fal-ai/flux/dev')"),
  input: z.record(z.any()).describe("Input parameters for the model"),
  stream: z.boolean().default(false).optional().describe("Whether to stream results"),
});

const RunWorkflowSchema = z.object({
  workflow_id: z.string().describe("The workflow ID (e.g., 'workflows/fal-ai/sdxl-sticker')"),
  input: z.record(z.any()).describe("Input parameters for the workflow"),
  stream: z.boolean().default(false).optional().describe("Whether to stream workflow events"),
});

const CheckStatusSchema = z.object({
  request_id: z.string().describe("The request ID to check status for"),
});

// Create MCP server
const server = new Server(
  {
    name: "fal-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_image",
        description: "Generate an image using Fal.ai models like Flux or Stable Diffusion",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text description of the image to generate",
            },
            model: {
              type: "string",
              description: "Model to use (default: fal-ai/flux/schnell)",
              default: "fal-ai/flux/schnell",
            },
            image_size: {
              type: "string",
              enum: ["square", "landscape_4_3", "portrait_3_4"],
              description: "Image size preset",
              default: "landscape_4_3",
            },
            num_images: {
              type: "number",
              description: "Number of images to generate (1-4)",
              default: 1,
            },
            seed: {
              type: "number",
              description: "Seed for reproducible generation",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "run_model",
        description: "Run any Fal.ai model with custom parameters",
        inputSchema: {
          type: "object",
          properties: {
            model_id: {
              type: "string",
              description: "The Fal.ai model endpoint ID",
            },
            input: {
              type: "object",
              description: "Input parameters for the model",
            },
            stream: {
              type: "boolean",
              description: "Whether to stream results",
              default: false,
            },
          },
          required: ["model_id", "input"],
        },
      },
      {
        name: "run_workflow",
        description: "Run a Fal.ai workflow (e.g., sdxl-sticker pipeline)",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID",
            },
            input: {
              type: "object",
              description: "Input parameters for the workflow",
            },
            stream: {
              type: "boolean",
              description: "Whether to stream workflow events",
              default: false,
            },
          },
          required: ["workflow_id", "input"],
        },
      },
      {
        name: "list_popular_models",
        description: "List popular Fal.ai models for image generation",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "check_status",
        description: "Check the status of a Fal.ai request",
        inputSchema: {
          type: "object",
          properties: {
            request_id: {
              type: "string",
              description: "The request ID to check",
            },
          },
          required: ["request_id"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!FAL_KEY) {
    throw new Error(
      "FAL_KEY environment variable is not set. Please set it to use Fal.ai services."
    );
  }

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_image": {
        const params = GenerateImageSchema.parse(args);
        const result = await fal.subscribe(params.model, {
          input: {
            prompt: params.prompt,
            image_size: params.image_size,
            num_images: params.num_images,
            ...(params.seed && { seed: params.seed }),
          },
          logs: true,
          onQueueUpdate: (update: any) => {
            console.error(`Queue position: ${update.position || "processing"}`);
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "run_model": {
        const params = RunModelSchema.parse(args);
        
        if (params.stream) {
          const stream = await fal.stream(params.model_id, {
            input: params.input,
          });
          
          const events: any[] = [];
          for await (const event of stream) {
            events.push(event);
          }
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        } else {
          const result = await fal.subscribe(params.model_id, {
            input: params.input,
            logs: true,
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      }

      case "run_workflow": {
        const params = RunWorkflowSchema.parse(args);
        
        if (params.stream) {
          const stream = await fal.stream(params.workflow_id, {
            input: params.input,
          });
          
          const events: any[] = [];
          for await (const event of stream) {
            events.push({
              type: event.type,
              data: event.data,
            });
          }
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        } else {
          const result = await fal.subscribe(params.workflow_id, {
            input: params.input,
            logs: true,
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      }

      case "list_popular_models": {
        const models = [
          {
            id: "fal-ai/flux/schnell",
            name: "FLUX.1 Schnell",
            description: "Fastest Flux model, 4 steps",
          },
          {
            id: "fal-ai/flux/dev",
            name: "FLUX.1 Dev",
            description: "High quality Flux model",
          },
          {
            id: "fal-ai/flux-pro",
            name: "FLUX.1 Pro",
            description: "Professional Flux model",
          },
          {
            id: "fal-ai/fast-sdxl",
            name: "Fast SDXL",
            description: "Fast Stable Diffusion XL",
          },
          {
            id: "fal-ai/stable-diffusion-v3-medium",
            name: "Stable Diffusion 3",
            description: "Latest Stable Diffusion",
          },
          {
            id: "fal-ai/recraft-v3",
            name: "Recraft V3",
            description: "Artistic style generation",
          },
          {
            id: "workflows/fal-ai/sdxl-sticker",
            name: "SDXL Sticker Workflow",
            description: "Generate → Remove BG → Create sticker",
          },
        ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(models, null, 2),
            },
          ],
        };
      }

      case "check_status": {
        const params = CheckStatusSchema.parse(args);
        // For now, return a message about status checking
        // Fal.ai queue.status requires both app_id and request_id
        
        return {
          content: [
            {
              type: "text",
              text: "Status checking requires both app_id and request_id. Use the result from run_model or run_workflow which includes status information.",
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Fal.ai MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});