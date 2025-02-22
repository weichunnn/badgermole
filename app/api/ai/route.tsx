import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.2-11b-vision-preview");

const QUERY_PROMPT = `You are a vision assistant for the visually impaired.

If the user asks a question, answer it in a single clear and concise sentence.
Do not provide any additional context or unnecessary details.

Question: {{question}}`;

const WALKING_PROMPT = `You are a vision assistant for the visually impaired.

Describe immediate hazards or obstacles in the path ahead.
Focus exclusively on safety-critical elements that could affect walking.
Be extremely brief and direct - mention only what could cause harm or block the path.
 and direct. Do not provide unnecessary information.`;

export async function POST(request: Request) {
  try {
    const { image, messages = [] } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const imageUrl = image.startsWith("data:") ? image : new URL(image);

    // Call Claude to analyze the image
    const { text } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: "user",
          content: [
            { type: "text", text: WALKING_PROMPT },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });

    // Return the description
    return NextResponse.json({
      description: text,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
