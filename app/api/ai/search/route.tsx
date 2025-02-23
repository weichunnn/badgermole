import { NextResponse } from "next/server";
import { createPerplexity } from "@ai-sdk/perplexity";
import { generateText } from "ai";

const perplexity = createPerplexity();
const model = perplexity("sonar-pro");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions accurately and concisely. Straight to the point.",
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    return NextResponse.json({
      answer: text,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
