import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ScriptData, PodcastScript } from "./type";
import { GraphAI, AgentFilterFunction, GraphData } from "graphai";
import * as agents from "@graphai/agents";

dotenv.config();

const graph_data: GraphData = {
  version: 0.5,
  nodes: {
    script: {
      value: "",
    },
    prompt: {
      value: "",
    },
    llm: {
      agent: "openAIAgent",
      inputs: {
        messages: [
          {
            role: "system",
            content: ":prompt",
          },
          {
            role: "user",
            content: ":script",
          },
        ],
      },
      params: {
        response_format: {
          type: "json_object",
        },
      },
      isResult: true,
    },
    output: {
      agent: "copyAgent",
      inputs: {
        text: ":llm.text",
      },
      params: {
        namedKey: "text",
      },
      isResult: true,
    },
  },
};

const main = async () => {
  const arg2 = process.argv[2];
  const scriptPath = path.resolve(arg2);
  const scriptData = fs.readFileSync(scriptPath, "utf-8");
  const script = JSON.parse(scriptData) as PodcastScript;

  const graph = new GraphAI(graph_data, {
    ...agents,
  });
  const prompt = fs.readFileSync("./prompts/image_prompt.md", "utf-8");
  graph.injectValue("prompt", prompt);
  graph.injectValue("script", JSON.stringify(script, null, 2));
  const results = await graph.run();
  if (results && typeof results.output === "string") {
    console.log(results.output);
    fs.writeFileSync(scriptPath, results.output);
  }
};

main();
