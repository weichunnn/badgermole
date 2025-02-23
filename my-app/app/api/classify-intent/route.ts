import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { sceneDescription, userPrompt, mode } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Anthropic API key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const systemPrompt = `You are an AI assistant helping classify intents for a blind assistance application. 
    Based on the scene description${mode === 'QUERY' ? ' and user prompt' : ''}, determine:

    1. IsAction (boolean):
       - true: if the intent requires calling an external agent/API (e.g., navigation routing, POI search, object detection)
       - false: if it's a passive request like scene description or text reading
    
    2. Category (must be exactly one of these):
       - Find thing: locating specific objects in the scene
       - Navigate: movement and routing requests
       - Dictate: reading text from the environment
       - Scene description: describing items or people in view
       - Search the point of interest: finding information about specific locations or landmarks
    
    Examples:
    - "Find the exit" -> {"isAction": true, "category": "Navigate", "confidence": 0.9}
    - "What's in front of me?" -> {"isAction": false, "category": "Scene description", "confidence": 0.9}
    - "Read this sign" -> {"isAction": false, "category": "Dictate", "confidence": 0.9}
    - "Tell me about this restaurant" -> {"isAction": true, "category": "Search the point of interest", "confidence": 0.9}
    
    Respond in JSON format only:
    {
      "isAction": boolean,
      "category": "category_name",
      "confidence": float (0-1)
    }`;

    const userMessage = `Scene description: ${sceneDescription}${
      mode === 'QUERY' && userPrompt ? `\nUser prompt: ${userPrompt}` : ''
    }`;

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 150,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt
    });

    // Parse the response as JSON
    const result = JSON.parse(message.content[0].text);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}