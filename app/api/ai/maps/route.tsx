import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.1-8b-instant");

async function getRouteFromGoogleAPI(
  origin: string,
  destination: string,
  transitType: string
) {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey as string,
      "X-Goog-FieldMask": [
        "routes.duration",
        "routes.distanceMeters",
        "routes.legs.steps.navigationInstruction.maneuver",
        "routes.legs.steps.navigationInstruction.instructions",
      ].join(","),
    },
    body: JSON.stringify({
      origin: {
        address: origin,
      },
      destination: {
        address: destination,
      },
      travelMode: transitType.toUpperCase(),
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "METRIC",
    }),
  });

  return await response.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, transitType = "WALKING" } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    // Get route from Google Routes API
    const routeData = await getRouteFromGoogleAPI(
      origin,
      destination,
      transitType
    );

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that converts route information into natural, easy-to-understand directions.",
        },
        {
          role: "user",
          content: `Convert this route information into natural language, explaining the journey details: ${JSON.stringify(
            routeData
          )}`,
        },
      ],
    });

    return NextResponse.json({
      directions: text,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
