import { ChatGroq } from "@langchain/groq";

import { GoogleRoutesAPI } from "@langchain/community/tools/google_routes";
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { NextResponse } from "next/server";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agentExecutor: any = null;

const createSearchAndRoutesAgent = async () => {
  const model = new ChatGroq({
    temperature: 0,
    model: "llama-3.1-8b-instant",
  });

  const googleRoutes = new GoogleRoutesAPI();

  // const tavilySearch = new TavilySearchResults({
  //   maxResults: 3,
  // });

  const duckDuckGoSearch = new DuckDuckGoSearch({
    maxResults: 3,
  });

  const tools = [googleRoutes, duckDuckGoSearch];
  const prompt = await pull<ChatPromptTemplate>("hwchase17/openai-tools-agent");

  const agent = createToolCallingAgent({
    llm: model,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!agentExecutor) {
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

    const result = await agentExecutor.invoke({
      input: query,
    });

    return NextResponse.json({
      result: result.output,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    agentReady: !!agentExecutor,
  });
}
