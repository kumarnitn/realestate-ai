import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will fail.");
}

export const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY || "dummy_key_for_build_only",
  temperature: 0.2,
});
