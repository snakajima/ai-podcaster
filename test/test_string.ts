import { splitIntoSentences } from "../src/split";

import test from "node:test";
import assert from "node:assert";

test("test strint", async () => {
  const ret = splitIntoSentences("あかさたなはまやらわ。東京特許許可局！", "。", 7);
  assert.deepStrictEqual(ret, [ 'あかさたなはまやらわ。', '東京特許許可局！' ]);
});
