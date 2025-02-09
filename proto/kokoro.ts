import { KokoroTTS } from "kokoro-js";

const modelId: string = "onnx-community/Kokoro-82M-v1.0-ONNX";

async function main() {
  const tts = await KokoroTTS.from_pretrained(modelId, {
    dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
    device: "cpu", // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
  });

  const text: string = "Life is like a box of chocolates. You never know what you're gonna get. Have fun!";
  const audio = await tts.generate(text, {
    voice: "af_heart", // Use `tts.list_voices()` to list all available voices
  });

  await audio.save("output/audio.wav");
}

main().catch(console.error);