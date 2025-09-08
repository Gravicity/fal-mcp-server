const { fal } = require("@fal-ai/client");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { pipeline } = require("stream");
const { promisify } = require("util");

const streamPipeline = promisify(pipeline);

// Configure with your API key
fal.config({
  credentials: "c25b30e0-49bd-4fee-acec-52752f275674:76ec0db757d23b0e330c4d9988d2db7b"
});

async function downloadImage(url, outputDir = process.cwd()) {
  try {
    // Create images directory if it doesn't exist
    const imagesDir = path.join(outputDir, "fal-images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // Generate filename
    const urlParts = url.split("/");
    const originalName = urlParts[urlParts.length - 1];
    const timestamp = new Date().getTime();
    const filename = `website-graphic-${timestamp}-${originalName}`;
    const filepath = path.join(imagesDir, filename);
    
    console.log("📥 Downloading to:", filepath);
    
    // Download the image using buffer approach
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    
    console.log("✅ File written, verifying...");
    
    // Verify the file was created
    if (!fs.existsSync(filepath)) {
      throw new Error("File was not created successfully");
    }
    
    return filepath;
  } catch (error) {
    console.error(`Failed to download image: ${error}`);
    throw error;
  }
}

async function generateWebsiteGraphic() {
  try {
    console.log("🎨 Generating professional website hero image...\n");
    
    const prompt = `Modern abstract technology background for website hero section, 
    gradient mesh with flowing purple to blue colors, geometric shapes floating, 
    clean minimalist design, soft glow effects, professional corporate style, 
    high quality digital art, 4k resolution, suitable for tech startup homepage`;
    
    console.log("📝 Prompt:", prompt, "\n");
    console.log("⏳ Generating with Flux Dev for high quality...\n");
    
    // Generate image with Flux Dev for better quality
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt,
        image_size: "landscape_4_3",  // Good for website headers
        num_images: 1,
        num_inference_steps: 28,  // Higher quality
        guidance_scale: 7.5
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_QUEUE") {
          console.log(`⏱️  Queue position: ${update.position || "waiting..."}`);
        } else if (update.status === "IN_PROGRESS") {
          console.log("🔄 Generating image...");
        }
      }
    });
    
    console.log("\n✅ Image generated successfully!");
    
    // Extract the actual data (may be nested)
    const data = result.data || result;
    
    // Display image details
    if (data.images && data.images[0]) {
      const img = data.images[0];
      console.log("\n📊 Image Details:");
      console.log(`  • URL: ${img.url}`);
      console.log(`  • Size: ${img.width}x${img.height}`);
      console.log(`  • Format: ${img.content_type || 'unknown'}`);
      
      // Try to download
      console.log("\n💾 Attempting to download locally...");
      try {
        const localPath = await downloadImage(img.url);
        console.log("✅ Saved to:", localPath);
        
        // Verify file
        if (fs.existsSync(localPath)) {
          const stats = fs.statSync(localPath);
          console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        }
      } catch (downloadError) {
        console.log("⚠️  Download failed - URL may have expired");
        console.log("💡 Copy the URL above quickly to view the image");
      }
      
      console.log("\n🎉 Website graphic ready for use!");
      console.log("💡 Perfect for hero sections, landing pages, or backgrounds");
    }
    
    // Show generation stats
    if (data.timings) {
      console.log(`\n⚡ Generation time: ${data.timings.inference.toFixed(2)} seconds`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Details:", error);
  }
}

generateWebsiteGraphic();