import { createGroq } from "@ai-sdk/groq";
import { NextRequest, NextResponse } from "next/server";
import { CategoryProcessor } from "../../../stuf/my-app/components/categoryHandler";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama3-8b-8192");

export async function POST(req: NextRequest) {
  try {
    const { inputPrompt } = await req.json();

    const systemPrompt = `You are an AI assistant helping classify intents for a blind assistance application. 
    
    Based on the user prompt determine the category (must be exactly one of these):
       - Describe: requests about describing the scene, reading text, or finding objects
       - Navigate: movement and routing requests
       - Search: finding information about locations, weather, or other general queries
    
    Examples:
    - "Find the exit" -> "Describe"
    - "What's in front of me?" -> "Describe"
    - "Read this sign" -> "Describe"
    - "How to go to the library" -> "Navigate"
    - "What is the weather today" -> "Search"
    
    Respond only with the category as a string matching exactly one of: "Describe", "Navigate", or "Search".`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: inputPrompt,
    });

    // Create a standardized response object
    const response = {
      category: text.trim(), // Will be one of: "Describe", "Navigate", or "Search"
      isAction: text.trim() === "Navigate" || text.trim() === "Search", // Navigation and Search are considered actions
      confidence: 0.9, // Default confidence level
      processedText: inputPrompt, // Original input for display purposes
      destination:
        text.trim() === "Navigate"
          ? inputPrompt.replace(/^.*?to\s+/i, "")
          : undefined, // Extract destination for navigation requests
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
