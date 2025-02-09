import fs from "fs";
import path from "path";
import { ScriptData, PodcastScript } from "./type";

function splitIntoSentences(
  paragraph: string,
  divider: string,
  minimum: number,
): string[] {
  let sentences = paragraph
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

const main = async () => {
  const arg2 = process.argv[2];
  const scriptPath = path.resolve(arg2);
  const scriptData = fs.readFileSync(scriptPath, "utf-8");
  const script = JSON.parse(scriptData) as PodcastScript;

  // Transfer imagePrompts to images.
  script.images = [];
  script.script.forEach((element, index) => {
    element.imageIndex = index;
    script.images.push({
      imagePrompt: element.imagePrompt,
      index,
      image: undefined
    });
    delete element.imagePrompt;
  });

  script.script = script.script.reduce<ScriptData[]>((prev, element) => {
    splitIntoSentences(element.text, "。", 10).forEach((sentence) => {
      splitIntoSentences(sentence, "？", 10).forEach((sentence) => {
        splitIntoSentences(sentence, "！", 10).forEach((sentence) => {
          splitIntoSentences(sentence, "、", 15).forEach((sentence) => {
            prev.push({ ...element, text: sentence });
          });
        });
      });
    });
    return prev;
  }, []);

  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
};

main();
