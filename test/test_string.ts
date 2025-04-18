import { splitIntoSentences, recursiveSplit } from "../src/split";

import test from "node:test";
import assert from "node:assert";

const text = "あかさたなはまやらわ。東京特許許可局！今日はいい天気ですか？";

const scriptData = {
  speaker: "",
  text,
  caption: "",
  instructions: "",
  duration: 1,
  filename: "",
  imagePrompt: "",
  imageIndex: 1,
};

test("test string", async () => {
  const ret = splitIntoSentences(text, "。", 7);
  assert.deepStrictEqual(ret, [
    "あかさたなはまやらわ。",
    "東京特許許可局！今日はいい天気ですか？",
  ]);
});

test("test string", async () => {
  const ret = recursiveSplit([scriptData]);
  const expect = [
    {
      speaker: "",
      text: "あかさたなはまやらわ。",
      caption: "",
      instructions: "",
      duration: 1,
      filename: "",
      imagePrompt: "",
      imageIndex: 1,
    },
    {
      speaker: "",
      text: "東京特許許可局！",
      caption: "",
      instructions: "",
      duration: 1,
      filename: "",
      imagePrompt: "",
      imageIndex: 1,
    },
    {
      speaker: "",
      text: "今日はいい天気ですか？",
      caption: "",
      instructions: "",
      duration: 1,
      filename: "",
      imagePrompt: "",
      imageIndex: 1,
    },
  ];
  assert.deepStrictEqual(ret, expect);
});
