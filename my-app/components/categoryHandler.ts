import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CategoryRequest {
  isAction: boolean;
  input: string;
  imgDesc: string;
}

type Category = 'Find thing' | 'Navigate' | 'Dictate' | 'Scene description';

interface CategoryResponse {
  category: Category;
  processedText: string;
}

class CategoryProcessor {
  private async callLLM(prompt: string): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      });
      
      const text = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
      return text;
    } catch (error) {
      console.error('Error calling Claude:', error);
      throw new Error('Failed to process request with Claude');
    }
  }

  private getCategoryPrompt(input: string, isAction: boolean): string {
    const safetyContext = isAction 
      ? "This is an action request."
      : "This is a general safety inquiry.";

    return `
      Context: ${safetyContext}
      User Input: "${input}"
      
      Analyze the input and determine which category it belongs to:
      - Find thing: Requests to locate specific objects
      - Navigate: Requests for movement or direction
      - Dictate: Requests to speak or write something
      - Scene description: Requests to describe items, people, or faces
      
      Respond with only the category name.
    `;
  }

  private getProcessingPrompt(category: Category, input: string, isAction: boolean): string {
    const baseContext = isAction 
      ? "Process this as an action request."
      : "Process this as a safety inquiry.";

    switch (category) {
      case 'Find thing':
        return `
          ${baseContext}
          Task: Object Location Processing
          Input: "${input}"
          
          Please analyze this request to find an object and provide a clear, actionable response.
          Focus on:
          1. The specific object to be located
          2. Any relevant characteristics or details
          3. The urgency or importance
          
          Example:
          Input: "I need to find my blue water bottle, I'm really thirsty"
          Response: Your blue water bottle is on the table.
          
          Respond with a single, clear sentence.
        `;

      case 'Navigate':
        return `
          ${baseContext}
          Task: Navigation Request Processing
          Input: "${input}"
          
          Provide clear, step-by-step navigation instructions.
          
          Example:
          Input: "How do I get to the kitchen?"
          Response: Turn right, walk 10 steps, and the kitchen will be on your left.
          
          Respond with concise directions.
        `;

      case 'Dictate':
        return `
          ${baseContext}
          Task: Dictation Request Processing
          Input: "${input}"
          
          Convert the request into clear speech content.
          
          Example:
          Input: "Send a text saying I'll be late"
          Response: I'll dictate: "I'll be late"
          
          Respond with only the content to be spoken.
        `;

      case 'Scene description':
        return `
          ${baseContext}
          Task: Scene Description Processing
          Input: "${input}"
          
          Provide a clear, concise scene description.
          
          Example:
          Input: "What's in front of me?"
          Response: There's a wooden desk with a laptop and coffee mug on it.
          
          Keep the description brief and focused.
        `;
    }
  }

  public async processCategory(request: CategoryRequest): Promise<CategoryResponse> {
    // First, determine the category
    const categoryPrompt = this.getCategoryPrompt(request.input, request.isAction);
    const category = await this.callLLM(categoryPrompt) as Category;

    // Then, process the input based on the category
    const processingPrompt = this.getProcessingPrompt(category, request.input, request.isAction);
    const processedText = await this.callLLM(processingPrompt);

    return {
      category,
      processedText
    };
  }
}

export { CategoryProcessor, CategoryRequest, CategoryResponse, Category };

async function example() {
    const processor = new CategoryProcessor();
    
    const request: CategoryRequest = {
      isAction: false,
      input: "Tell me which bus is here",
      imgDesc: "Since the request asked for a general description of the scene including details about the environment, buildings, people, and text visible, this best fits into the Scene description category."
    };
  
    const result = await processor.processCategory(request);
    console.log(result);
}
