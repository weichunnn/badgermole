import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.2-11b-vision-preview");

const PROMPT = `

You are a helper for visually impaired people.

Please describe the image shown above. Be short and concise.

Focus on the most important details and avoid unnecessary information.

Output should be 3 sentence long less than 30 words. Each line ends with a newline.
`;

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
