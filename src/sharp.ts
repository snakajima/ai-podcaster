import sharp from 'sharp';

async function renderJapaneseTextToPNG(
  text: string,
  fontSize: number,
  imageWidth: number,
  outputFilePath: string
) {
  const lineHeight = fontSize * 1.2;

  // Estimate the character width as approximately half the font size.
  const charWidthEstimate = fontSize * 1.0;
  const maxCharsPerLine = Math.floor(imageWidth / charWidthEstimate);

  const lines: string[] = [];
  let startIndex = 0;

  // Wrap text by the calculated max characters per line
  while (startIndex < text.length) {
    lines.push(text.slice(startIndex, startIndex + maxCharsPerLine));
    startIndex += maxCharsPerLine;
  }

  const imageHeight = lines.length * lineHeight;

  // Create SVG content for Japanese text rendering
  const svgContent = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" />
      <text x="0" y="${fontSize}" font-size="${fontSize}" font-family="Arial" fill="black">
        ${lines.map((line, index) => `<tspan x="0" y="${fontSize + index * lineHeight}">${line}</tspan>`).join('')}
      </text>
    </svg>
  `;

  // Use sharp to convert the SVG to PNG
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputFilePath);

  console.log(`Image saved to ${outputFilePath}`);
}

// Usage
renderJapaneseTextToPNG(
  'これは日本語のテキストで、スペースがなく連続して描画される必要があります。適切にレンダリングできるかテストします。',
  24, // Font size in pixels
  400, // Image width in pixels
  'output.png' // Output file path
).catch((err) => {
  console.error('Error generating PNG:', err);
});