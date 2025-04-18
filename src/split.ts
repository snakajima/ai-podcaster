import fs from "fs";
import path from "path";
import { ScriptData, PodcastScript } from "./type";

export function splitIntoSentences(
  paragraph: string,
  divider: string,
  minimum: number,
): string[] {
  const sentences = paragraph
    .split(divider) // Split by the Japanese full stop
    .map((sentence) => sentence.trim()) // Trim whitespace
    .filter((sentence) => sentence.length > 0); // Remove empty sentences

  return sentences
    .reduce<string[]>((acc, sentence) => {
      if (acc.length > 0 && acc[acc.length - 1].length < minimum) {
        acc[acc.length - 1] += divider + sentence;
      } else {
        acc.push(sentence);
      }
      return acc;
    }, [])
    .map((sentence, index, array) =>
      index < array.length - 1 || paragraph.endsWith(divider)
        ? sentence + divider
        : sentence,
    );
}

export const recursiveSplit = (scripts: ScriptData[]) => {
  return scripts.reduce<ScriptData[]>((prev, element) => {
    splitIntoSentences(element.text, "。", 7).forEach((sentence) => {
      splitIntoSentences(sentence, "？", 7).forEach((sentence) => {
        splitIntoSentences(sentence, "！", 7).forEach((sentence) => {
          splitIntoSentences(sentence, "、", 7).forEach((sentence) => {
            prev.push({ ...element, text: sentence });
          });
        });
      });
    });
    return prev;
  }, []);
};
/*
interface Replacement {
  from: string;
  to: string;
}

function replacePairs(str: string, replacements: Replacement[]): string {
  replacements.forEach(({ from, to }) => {
    // Escape any special regex characters in the 'from' string.
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedFrom, "g");
    str = str.replace(regex, to);
  });
  return str;
}

const replacements: Replacement[] = [
  { from: "Anthropic", to: "アンスロピック" },
];
*/

const main = async () => {
  const arg2 = process.argv[2];
  const scriptPath = path.resolve(arg2);
  const scriptData = fs.readFileSync(scriptPath, "utf-8");
  const script = JSON.parse(scriptData) as PodcastScript;

  if (script.images === undefined) {
    // Transfer imagePrompts to images.
    script.images = [];
    script.script.forEach((element, index) => {
      element.imageIndex = index;
      script.images.push({
        imagePrompt: element.imagePrompt,
        index,
        image: undefined,
      });
      delete element.imagePrompt;
    });
  }

  script.script = recursiveSplit(script.script);
  console.log(script.script);
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
};

if (process.argv[1] === __filename) {
  main();
}
