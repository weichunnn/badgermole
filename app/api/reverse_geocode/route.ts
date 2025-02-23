import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();
    const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured");
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("No results found");
    }

    // Find the street address component
    const addressComponents = data.results[0].address_components;
    const streetNumber =
      addressComponents.find((component: any) =>
        component.types.includes("street_number")
      )?.long_name || "";

    const streetName =
      addressComponents.find((component: any) =>
        component.types.includes("route")
      )?.long_name || "";

    const street =
      `${streetNumber} ${streetName}`.trim() ||
      data.results[0].formatted_address;

    return NextResponse.json({ street });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
