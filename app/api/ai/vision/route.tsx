import { NextResponse } from "next/server";
import { createGroq, groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";

const apiKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2];
let currentApiKeyIndex = 0;

function getCurrentApiKey() {
  return apiKeys[currentApiKeyIndex];
}

function switchApiKey() {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
}

const WALKING_PROMPT = `Analyze the image for hazards. People are safe. Return JSON in this format:
{
  "hazard": "" // empty string if safe, or brief hazard description (max 10 words)
}

Examples of valid responses:
{"hazard": ""} // when safe
{"hazard": "Hole in sidewalk ahead, move right"}
{"hazard": "Wet floor sign, surface slippery"}
{"hazard": "Low hanging branch at head level"}`;

const responseSchema = z.object({
  hazard: z
    .string()
    .refine(
      (str) => str === "" || str.split(" ").length <= 10,
      "Must be empty string or max 10 words"
    ),
});

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

    const groq = createGroq({ apiKey: getCurrentApiKey() });
    const model = groq("llama-3.2-90b-vision-preview");

    const { text } = await generateText({
      model: model,
      temperature: 0.1,
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
      maxTokens: 50,
    });

    // Try to extract JSON from the response if it's not already valid JSON
    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Parse and validate the response
    try {
      const parsedResponse = JSON.parse(jsonText);
      const validatedResponse = responseSchema.parse(parsedResponse);

      return NextResponse.json({
        description: validatedResponse.hazard,
      });
    } catch (parseError) {
      console.error("Failed to parse LLM response:", text, parseError);
      throw new Error("Invalid JSON response from LLM");
    }
  } catch (error) {
    if (
      error.responseBody &&
      error.responseBody.message.includes("Rate limit")
    ) {
      console.warn("Rate limit hit, switching API key");
      switchApiKey();

      // Extract retry-after time from the error message
      const retryAfterMatch = error.responseBody.message.match(
        /try again in (\d+(\.\d+)?)s/
      );
      const retryAfterSeconds = retryAfterMatch
        ? parseFloat(retryAfterMatch[1])
        : 0;

      // Wait for the specified retry-after time before retrying
      if (retryAfterSeconds > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryAfterSeconds * 1000)
        );
      }

      return POST(request); // Retry the request with the new API key
    }
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
