import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.2-11b-vision-preview");

const PROMPT = "What is in this image? Be short and concise.";
export async function POST(request: Request) {
  try {
    // Get the image data from the request
    const { image } = await request.json();

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
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
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
