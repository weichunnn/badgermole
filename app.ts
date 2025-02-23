import dotenv from 'dotenv';
dotenv.config();

import { CategoryProcessor, CategoryRequest, CategoryResponse } from './src/categoryHandler';

const processor = new CategoryProcessor();

async function main() {
  try {
    const request: CategoryRequest = {
      isAction: false,
      input: "Tell me which bus is here",
      imgDesc: "Since the request asked for a general description of the scene including details about the environment, buildings, people, and text visible, this best fits into the \"Scene description\" category. It's not an action request as it's not asking to find something specific, navigate somewhere, or read specific text. The high confidence score reflects that this is clearly a request for overall scene description rather than other categories."
    };

    const response = await processor.processCategory(request);
    console.log('Category:', response.category);
    console.log('Processed Text:', response.processedText);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

