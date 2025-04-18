import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas } from "canvas";
import { ScriptData, PodcastScript, ImageInfo } from "./type";

type CanvasInfo = {
  width: number;
  height: number;
};

const separateText = (text: string, fontSize: number, actualWidth: number) => {
  let currentLine = "";
  let currentWidth = 0;

  const lines: string[] = [];
  // Iterate over each character and determine line breaks based on character width estimate
  text.split("").forEach((char) => {
    const code = char.charCodeAt(0);
    const isAnsi = code < 255;
    const isCapital = code >= 0x40 && code < 0x60;
    const charWidth = (isAnsi ? (isCapital ? 0.8 : 0.5) : 1) * fontSize;
    const isTrailing = ["。", "、", "？", "！"].includes(char);

    if (char === "\n") {
      lines.push(currentLine);
      currentLine = "";
      currentWidth = 0;
    } else if (currentWidth + charWidth > actualWidth && !isTrailing) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }
  });

  // Push the last line if there's any remaining text
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

async function renderJapaneseTextToPNG(
  text: string,
  outputFilePath: string,
  canvasInfo: CanvasInfo,
) {
  const fontSize = 48;
  const paddingX = fontSize * 2;
  const paddingY = 12;
  const lineHeight = fontSize + 8;

  const actualWidth = canvasInfo.width - paddingX * 2;
  const lines = separateText(text, fontSize, actualWidth);

  const textHeight = lines.length * lineHeight + paddingY * 2;
  const textTop = canvasInfo.height - textHeight;

  // Create a canvas and a drawing context
  const canvas = createCanvas(canvasInfo.width, canvasInfo.height);
  const context = canvas.getContext("2d");

  // Set background color
  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(0, textTop, canvasInfo.width, textHeight);

  // Set text styles
  context.font = `bold ${fontSize}px Arial`;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "top";

  // Set shadow properties
  context.shadowColor = "rgba(0, 0, 0, 0.8)";
  context.shadowOffsetX = 5;
  context.shadowOffsetY = 5;
  context.shadowBlur = 10;

  lines.forEach((line: string, index: number) => {
    context.fillText(
      line,
      canvasInfo.width / 2,
      textTop + lineHeight * index + paddingY,
    );
  });

  // Save the image
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputFilePath, buffer);

  console.log(`Image saved to ${outputFilePath}`);
}

interface CaptionInfo {
  pathCaption: string;
  imageIndex: number;
  duration: number; // Duration in seconds for each image
}

const createVideo = (
  audioPath: string,
  captions: CaptionInfo[],
  images: ImageInfo[],
  outputVideoPath: string,
  canvasInfo: CanvasInfo,
  omitCaptions: boolean,
) => {
  const start = performance.now();
  let command = ffmpeg();

  // Add each image input
  images.forEach((element) => {
    command = command.input(element.image!); // HACK
  });
  captions.forEach((element) => {
    command = command.input(element.pathCaption);
  });
  const imageCount = images.length;
  const captionCount = captions.length;

  // Build filter_complex string to manage start times
  const filterComplexParts: string[] = [];

  captions.forEach((element, index) => {
    // Add filter for each image
    if (omitCaptions) {
      filterComplexParts.push(
        // 無限ループ → duration 秒分のフレームを生成 → 30fps に設定 → タイムスタンプ リセット → サイズ調整
        `[${element.imageIndex}:v]loop=loop=-1:size=1:start=0,` +
          `trim=duration=${element.duration},` +
          `fps=30,` +
          `setpts=PTS-STARTPTS,` +
          `scale=${canvasInfo.width}:${canvasInfo.height},` +
          `setsar=1,format=yuv420p` +
          `[v${index}]`,
      );
    } else {
      filterComplexParts.push(
        // Resize background image to match canvas dimensions
        `[${element.imageIndex}:v]scale=${canvasInfo.width}:${canvasInfo.height},` +
          `setsar=1,` +
          `trim=duration=${element.duration}[bg${index}];` +
          `[${imageCount + index}:v]scale=${canvasInfo.width * 2}:${canvasInfo.height * 2},` +
          `setsar=1,` +
          `format=rgba,` +
          `zoompan=z=zoom+0.0004:x=iw/2-(iw/zoom/2):y=ih-(ih/zoom):s=${canvasInfo.width}x${canvasInfo.height}:fps=30:d=${element.duration * 30},` +
          `trim=duration=${element.duration}[cap${index}];` +
          `[bg${index}][cap${index}]overlay=(W-w)/2:(H-h)/2:format=auto[v${index}]`,
      );
    }
  });

  // Concatenate the trimmed images
  const concatInput = captions.map((_, index) => `[v${index}]`).join("");
  filterComplexParts.push(
    `${concatInput}concat=n=${captions.length}:v=1:a=0[v]`,
  );

  // Apply the filter complex for concatenation and map audio input
  command
    .complexFilter(filterComplexParts)
    .input(audioPath) // Add audio input
    .outputOptions([
      "-preset veryfast", // Faster encoding
      "-map [v]", // Map the video stream
      `-map ${imageCount + captionCount}:a`, // Map the audio stream (audio is the next input after all images)
      "-c:v h264_videotoolbox", // Set video codec
      "-threads 8",
      "-filter_threads 8",
      "-b:v 5M", // bitrate (only for videotoolbox)
      "-bufsize",
      "10M", // Add buffer size for better quality
      "-maxrate",
      "7M", // Maximum bitrate
      "-r 30", // Set frame rate
      "-pix_fmt yuv420p", // Set pixel format for better compatibility
    ])
    .on("start", (__cmdLine) => {
      console.log("Started FFmpeg ..."); // with command:', cmdLine);
    })
    .on("error", (err, stdout, stderr) => {
      console.error("Error occurred:", err);
      console.error("FFmpeg stdout:", stdout);
      console.error("FFmpeg stderr:", stderr);
    })
    .on("end", () => {
      const end = performance.now();
      console.log(`Video created successfully! ${end - start}ms`);
    })
    .output(outputVideoPath)
    .run();
};

const main = async () => {
  const arg2 = process.argv[2];
  const scriptPath = path.resolve(arg2);
  const parsedPath = path.parse(scriptPath);
  const name = parsedPath.name;
  const data = fs.readFileSync(scriptPath, "utf-8");
  const jsonData: PodcastScript = JSON.parse(data);

  const tmScriptPath = path.resolve("./output/" + name + ".json");
  const dataTm = fs.readFileSync(tmScriptPath, "utf-8");
  const jsonDataTm: PodcastScript = JSON.parse(dataTm);

  const canvasInfo =
    jsonData.aspectRatio === "9:16"
      ? {
          width: 720,
          height: 1280,
        }
      : {
          width: 1280, // not 1920
          height: 720, // not 1080
        };

  try {
    await renderJapaneseTextToPNG(
      `${jsonData.title}\n\n${jsonData.description}`,
      `./scratchpad/${name}_00.png`, // Output file path
      canvasInfo,
    );
  } catch (err) {
    console.error("Error generating PNG:", err);
    throw err;
  }

  const promises = jsonData.script.map(
    async (element: ScriptData, index: number) => {
      try {
        const imagePath = `./scratchpad/${name}_${index}.png`; // Output file path
        await renderJapaneseTextToPNG(
          element.caption ?? element.text,
          imagePath,
          canvasInfo,
        );
        const caption: CaptionInfo = {
          pathCaption: path.resolve(imagePath),
          imageIndex: element.imageIndex,
          duration: jsonDataTm.script[index].duration,
        };
        return caption;
      } catch (err) {
        console.error("Error generating PNG:", err);
        throw err;
      }
    },
  );
  const captions = await Promise.all(promises);

  const audioPath = path.resolve("./output/" + name + "_bgm.mp3");
  const outputVideoPath = path.resolve("./output/" + name + "_ja.mp4");
  const titleInfo: CaptionInfo = {
    pathCaption: path.resolve(`./scratchpad/${name}_00.png`), // HACK
    imageIndex: 0, // HACK
    duration: (jsonData.padding ?? 4000) / 1000,
  };
  const captionsWithTitle = [titleInfo].concat(captions);
  // const captionsWithTitle = [captions[0], captions[1], captions[5], captions[8]];
  const images: ImageInfo[] = [];
  if (jsonData.imagePath) {
    images.push({
      index: 0,
      imagePrompt: undefined,
      image: jsonData.imagePath + "001.png",
    });
    images.push({
      index: 0,
      imagePrompt: undefined,
      image: jsonData.imagePath + "002.png",
    });
    images.push({
      index: 0,
      imagePrompt: undefined,
      image: jsonData.imagePath + "003.png",
    });
    images.push({
      index: 0,
      imagePrompt: undefined,
      image: jsonData.imagePath + "004.png",
    });
  }

  createVideo(
    audioPath,
    captionsWithTitle,
    images.length > 0 ? images : jsonDataTm.images,
    outputVideoPath,
    canvasInfo,
    !!jsonData.omitCaptions,
  );
};

main();
