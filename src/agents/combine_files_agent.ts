import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { PodcastScript } from "../type";

const combineFilesAgent: AgentFunction<
  null,
  string,
  { script: PodcastScript; combinedFileName: string }
> = async ({ namedInputs }) => {
  const { script, combinedFileName } = namedInputs;
  const outputFile = path.resolve(combinedFileName);
  const silentPath = path.resolve("./music/silent300.mp3");
  const silentLastPath = path.resolve("./music/silent800.mp3");
  const command = ffmpeg();
  script.script.forEach((element: any, index: number) => {
    const filePath = path.resolve("./scratchpad/" + element.filename + ".mp3");
    const isLast = index === script.script.length - 2;
    command.input(filePath);
    command.input(isLast ? silentLastPath : silentPath);
    // Measure and log the timestamp of each section
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error while getting metadata:", err);
      } else {
        element["duration"] = metadata.format.duration! + (isLast ? 0.8 : 0.3);
      }
    });
  });

  const promise = new Promise((resolve, reject) => {
    command
      .on("end", () => {
        console.log("MP3 files have been successfully combined.");
        resolve(0);
      })
      .on("error", (err: any) => {
        console.error("Error while combining MP3 files:", err);
        reject(err);
      })
      .mergeToFile(outputFile, path.dirname(outputFile));
  });

  await promise;

  return {
    fileName: outputFile,
    script,
  };
};

const combineFilesAgentInfo: AgentFunctionInfo = {
  name: "combineFilesAgent",
  agent: combineFilesAgent,
  mock: combineFilesAgent,
  samples: [],
  description: "combineFilesAgent",
  category: ["ffmpeg"],
  author: "satoshi nakajima",
  repository: "https://github.com/snakajima/ai-podcaster",
  license: "MIT",
};

export default combineFilesAgentInfo;
