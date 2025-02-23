import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { createPerplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq('llama-3.2-90b-vision-preview');

const perplexity = createPerplexity();
const perplexityModel = perplexity('sonar-pro');

enum MODE {
  QUERY = 'query',
  WALKING = 'walking',
}

const QUERY_PROMPT = `You are a vision assistant for the visually impaired.
Describe what you see in the image that's relevant to this question. Be clear and concise.
Question: {{userQuery}}`;

const WALKING_PROMPT = `Give me a description of this image. Include full details on items, what's written and important information that would help describe this to a blind person. Make sure to keep track of the location of everything and include context clues so that I can understand everything in this image without seeing it visually through the text description`;

const SEARCH_SYSTEM_PROMPT =
  'You are a helpful assistant that answers questions accurately and concisely based on the provided context. Straight to the point.';

export async function POST(request: Request) {
  console.log('Vision Query API called');
  try {
    const {
      image,
      messages = [],
      type = MODE.QUERY,
      userQuery = '',
    } = await request.json();

    console.log('Vision Input:', {
      type,
      userQuery,
      messageCount: messages.length,
    });

    // Validate inputs
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!userQuery) {
      return NextResponse.json(
        { error: 'Query is required for query/search mode' },
        { status: 400 }
      );
    }

    // First, always get the vision context
    const imageUrl = image.startsWith('data:') ? image : new URL(image);

    console.log('Vision Generated');
    const { text: visionContext } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                type === MODE.WALKING
                  ? WALKING_PROMPT
                  : QUERY_PROMPT.replace('{{userQuery}}', userQuery),
            },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });

    // For walking or basic query mode, return the vision context directly
    //if (type === MODE.WALKING || type === MODE.QUERY) {
    //  return NextResponse.json({ description: visionContext });
    //}

    // For search mode, use the vision context to inform the search response
    console.log('Search Generated');
    const { text: searchResponse } = await generateText({
      model: perplexityModel,
      messages: [
        {
          role: 'system',
          content: SEARCH_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Image Context: ${visionContext}\n\nBased on this context, please answer: ${userQuery}`,
        },
      ],
    });

    return NextResponse.json({
      description: searchResponse,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
