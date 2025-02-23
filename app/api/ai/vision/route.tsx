import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq('llama-3.2-90b-vision-preview');

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
      (str) => str === '' || str.split(' ').length <= 10,
      'Must be empty string or max 10 words'
    ),
});

export async function POST(request: Request) {
  try {
    const { image, messages = [] } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const imageUrl = image.startsWith('data:') ? image : new URL(image);

    const { text } = await generateText({
      model,
      temperature: 0.1,
      messages: [
        ...messages,
        {
          role: 'user',
          content: [
            { type: 'text', text: WALKING_PROMPT },
            { type: 'image', image: imageUrl },
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
      console.error('Failed to parse LLM response:', text, parseError);
      throw new Error('Invalid JSON response from LLM');
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
