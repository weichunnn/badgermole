import { ChatGroq } from "@langchain/groq";
import { GoogleRoutesAPI } from "@langchain/community/tools/google_routes";
import { NextResponse } from "next/server";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agentExecutor: any = null;

const createSearchAndRoutesAgent = async () => {
  console.log("Initializing ChatGroq model...");
  const model = new ChatGroq({
    temperature: 0,
    model: "llama-3.1-8b-instant",
    cache: true,
    verbose: true,
    callbacks: [new ConsoleCallbackHandler()],
  });

  console.log("Initializing tools...");
  const googleRoutes = new GoogleRoutesAPI({
    callbacks: [new ConsoleCallbackHandler()],
  });

  const duckDuckGoSearch = new DuckDuckGoSearch({
    maxResults: 3,
    callbacks: [new ConsoleCallbackHandler()],
  });

  const tools = [googleRoutes, duckDuckGoSearch];

  console.log("Pulling prompt template...");
  const prompt = await pull<ChatPromptTemplate>("hwchase17/openai-tools-agent");

  console.log("Creating tool-calling agent...");
  const agent = createToolCallingAgent({
    llm: model,
    tools,
    prompt,
    verbose: true,
    callbacks: [new ConsoleCallbackHandler()],
  });

  console.log("Creating agent executor...");
  return new AgentExecutor({
    agent,
    tools,
    verbose: true,
    callbacks: [new ConsoleCallbackHandler()],
    returnIntermediateSteps: true, // This will show all steps in the result
  });
};

export async function POST(request: Request) {
  try {
    console.log("Starting POST request processing...");
    const startTime = Date.now();

    const body = await request.json();
    const { query } = body;

    console.log("Received query:", query);

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!agentExecutor) {
      console.log("Initializing agent executor...");
      try {
        agentExecutor = await createSearchAndRoutesAgent();
      } catch (error) {
        console.error("Failed to initialize agent:", error);
        return NextResponse.json(
          { error: "Failed to initialize agent" },
          { status: 500 }
        );
      }
    }

    console.log("Invoking agent executor...");
    const result = await agentExecutor.invoke({
      input: query,
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log("Agent execution completed:");
    console.log("- Execution time:", executionTime, "ms");
    console.log("- Intermediate steps:", result.intermediateSteps);
    console.log("- Final output:", result.output);

    return NextResponse.json({
      result: result.output,
      executionTime,
      intermediateSteps: result.intermediateSteps,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    agentReady: !!agentExecutor,
  });
}
