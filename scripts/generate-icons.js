const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function generateIcon(size) {
  const svgBuffer = fs.readFileSync("./public/icon.svg");

  try {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    const outputPath = `./public/icon-${size}x${size}.png`;
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`✓ Generated icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`Error generating ${size}x${size}:`, error.message);
  }
}

async function generateAllIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  console.log("Generating PWA icons...\n");

  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log("\n✓ All icons generated successfully!");
}

generateAllIcons().catch(console.error);
