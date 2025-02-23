import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq('llama-3.2-90b-vision-preview');

enum MODE {
  QUERY = 'query',
  WALKING = 'walking',
}

const QUERY_PROMPT = `You are a vision assistant for the visually impaired.

If the user asks a question, answer it in a single clear and concise sentence.
Do not provide any additional context or unnecessary details.

Question: {{userQuery}}`;

const WALKING_PROMPT = `Give me a description of this image. Include full details on items, what's written and important information that would help describe this to a blind person. Make sure to keep track of the location of everything and include context clues so that I can understand everything in this image without seeing it visually through the text description`;

export async function POST(request: Request) {
  try {
    const { image, messages = [], type = MODE.QUERY, userQuery = '' } = await request.json();
    console.log('Vision Input:', {
      type,
      userQuery,
      messageCount: messages.length
    });
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const imageUrl = image.startsWith('data:') ? image : new URL(image);

    // Call Claude to analyze the image
    const { text } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: type == MODE.WALKING ? WALKING_PROMPT : QUERY_PROMPT.replace('{{userQuery}}', userQuery),
            },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });

    console.log('Vision Output:', {
      text,
      type
    });

    // Return the description
    return NextResponse.json({
      description: text,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
