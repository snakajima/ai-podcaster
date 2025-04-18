import fs from "fs";
import path from "path";
import { PodcastScript } from "./type";

export const readPodcastScriptFile = (arg2: string) => {
  const scriptPath = path.resolve(arg2);
  if (!fs.existsSync(scriptPath)) {
    return null;
  }
  const scriptData = fs.readFileSync(scriptPath, "utf-8");
  const script = JSON.parse(scriptData) as PodcastScript;
  const parsedPath = path.parse(scriptPath);

  return {
    podcastData: script,
    podcastDataPath: scriptPath,
    fileName: parsedPath.name,
  };
};

export const getOutputFilePath = (fileName: string) => {
  const filePath = path.resolve("./output/" + fileName);
  return filePath;
};

export const getScratchpadFilePath = (fileName: string) => {
  const filePath = path.resolve("./scratchpad/" + fileName);
  return filePath;
};
