import { GoogleGenAI } from "@google/genai";
import { getPriceHistory } from "./cmc";
import { tokens } from "./tokens";

const ai = new GoogleGenAI({
  apiKey: Bun.env.GOOGLE_API_KEY,
  httpOptions: {},
});

type GoogleGenAiConfig = NonNullable<
  Parameters<GoogleGenAI["models"]["generateContent"]>["0"]["config"]
>;

type AgentConfig = Omit<
  GoogleGenAiConfig,
  "responseMimeType" | "responseJsonSchema" | "systemInstruction"
>;
type ModelName = "gemini-2.0-flash";

interface PromptGuardResult {
  valid: boolean;
  reason?: string;
}

interface TokenExtractionResult {
  ticker: string;
  found: boolean;
}

interface TradeDecision {
  token: string;
  sl: number;
  tp: number;
  entry: number;
  currentPrice: number;
  message: string;
  reject: boolean;
  confidence: number;
}

export class Agent {
  preamble: string;
  ai: GoogleGenAI;
  model: ModelName;
  config: AgentConfig = {};
  responseJsonSchema: any;
  knowledges: string[] = [];

  constructor(options: { preamble: string; model: ModelName }) {
    this.preamble = options.preamble;
    this.model = options.model;
    this.ai = new GoogleGenAI({
      apiKey: Bun.env.GOOGLE_API_KEY,
    });
  }

  async prompt(input: string) {
    const contents = this.parsePrompt(input);
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config: this.getConfig(),
    });

    if (this.responseJsonSchema) {
      const jsonText = res.candidates?.[0].content?.parts
        ?.map((part) => part.text)
        .join("");
      if (!jsonText) {
        return {};
      }
      const json = JSON.parse(jsonText);
      return json;
    }

    return res.candidates?.[0].content;
  }

  /**
   * Step 1: Prompt Guard - Validates if the prompt is appropriate for trading
   */
  async promptGuard(userPrompt: string): Promise<PromptGuardResult> {
    const guardAgent = new Agent({
      model: "gemini-2.0-flash",
      preamble: `You are a prompt guard for a cryptocurrency trading bot. 
      Analyze the user's prompt and determine if it's appropriate for cryptocurrency trading.
      
      Valid prompts include:
      - Requests for trade recommendations
      - Questions about specific cryptocurrencies
      - Market analysis requests
      - Price predictions
      
      Invalid prompts include:
      - Requests for financial advice beyond trading
      - Non-crypto related queries
      - Harmful or inappropriate content
      - Requests to trade stocks, forex, or other non-crypto assets
      
      Return your analysis with valid: true/false and a reason if invalid.`,
    });

    guardAgent.responseJsonSchema = {
      type: "object",
      properties: {
        valid: { type: "boolean" },
        reason: { type: "string" },
      },
      required: ["valid"],
    };

    const result = await guardAgent.prompt(userPrompt);
    return result as PromptGuardResult;
  }

  /**
   * Step 2: Extract ticker from user prompt
   */
  async extractTicker(userPrompt: string): Promise<TokenExtractionResult> {
    const tickerAgent = new Agent({
      model: "gemini-2.0-flash",
      preamble: `You are a token ticker extraction agent. 
      Analyze the user's prompt and extract the cryptocurrency ticker they want to trade.
      
      Available tokens: ${tokens.map((t) => t.symbol).join(", ")}
      
      If no specific token is mentioned, suggest the most relevant one based on context.
      If multiple tokens are mentioned, pick the primary one for trading.
      
      Remember: w(wrapped) tokens may be referred to by their original name (wSEI as SEI, wBTC as BTC).`,
    });

    tickerAgent.responseJsonSchema = {
      type: "object",
      properties: {
        ticker: { type: "string" },
        found: { type: "boolean" },
      },
      required: ["ticker", "found"],
    };

    const result = await tickerAgent.prompt(userPrompt);
    return result as TokenExtractionResult;
  }

  /**
   * Step 3-4: Analyze price history and make trade decision
   */
  async makeTradeDecision(
    userPrompt: string,
    ticker: string,
    priceHistory: any
  ): Promise<TradeDecision> {
    const tradeAgent = new Agent({
      model: "gemini-2.0-flash",
      preamble: `You are an expert cryptocurrency trading analyst. 
      Based on the user's prompt, token ticker, and price history data, provide a detailed trade recommendation.
      
      Analyze:
      - Price trends and patterns
      - Volume indicators
      - Support and resistance levels
      - Risk management parameters
      
      Provide specific entry, stop loss, and take profit levels with detailed reasoning.
      Set reject to true only if the trade setup is too risky or unclear.`,
    });

    tradeAgent.knowledges.push(
      `Price History Data for ${ticker}:\n${JSON.stringify(
        priceHistory,
        null,
        2
      )}`
    );
    tradeAgent.knowledges.push(
      `Available tokens: ${tokens
        .map((t) => `${t.symbol} (${t.name})`)
        .join(", ")}`
    );

    tradeAgent.responseJsonSchema = {
      type: "object",
      properties: {
        token: { type: "string" },
        sl: { type: "number" },
        tp: { type: "number" },
        entry: { type: "number" },
        currentPrice: { type: "number" },
        message: { type: "string" },
        reject: { type: "boolean" },
        confidence: { type: "number" },
      },
      required: [
        "token",
        "sl",
        "tp",
        "entry",
        "currentPrice",
        "message",
        "reject",
        "confidence",
      ],
    };

    const result = await tradeAgent.prompt(userPrompt);
    return result as TradeDecision;
  }

  /**
   * Complete trading workflow
   */
  async processTradeRequest(userPrompt: string): Promise<{
    guardResult: PromptGuardResult;
    tickerResult?: TokenExtractionResult;
    priceHistory?: any;
    tradeDecision?: TradeDecision;
    error?: string;
  }> {
    try {
      // Step 1: Prompt Guard
      console.log("🛡️ Running prompt guard...");
      const guardResult = await this.promptGuard(userPrompt);

      if (!guardResult.valid) {
        return {
          guardResult,
          error: guardResult.reason || "Prompt validation failed",
        };
      }

      // Step 2: Extract ticker
      console.log("🎯 Extracting ticker...");
      const tickerResult = await this.extractTicker(userPrompt);

      if (!tickerResult.found) {
        return {
          guardResult,
          tickerResult,
          error: "Could not identify a valid cryptocurrency ticker",
        };
      }

      // Step 3: Get price history
      console.log(`📈 Fetching price history for ${tickerResult.ticker}...`);
      const priceHistory = await getPriceHistory(tickerResult.ticker, 7);

      if (!priceHistory.success) {
        return {
          guardResult,
          tickerResult,
          priceHistory,
          error: `Failed to fetch price history: ${priceHistory.error}`,
        };
      }

      // Step 4: Make trade decision
      console.log("🤖 Analyzing and making trade decision...");
      const tradeDecision = await this.makeTradeDecision(
        userPrompt,
        tickerResult.ticker,
        priceHistory
      );

      return {
        guardResult,
        tickerResult,
        priceHistory,
        tradeDecision,
      };
    } catch (error) {
      return {
        guardResult: { valid: false, reason: "System error occurred" },
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private getConfig() {
    let config: GoogleGenAiConfig = {
      ...this.config,
      systemInstruction: this.preamble,
    };

    if (this.responseJsonSchema) {
      config.responseMimeType = "application/json";
      config.responseJsonSchema = this.responseJsonSchema;
    }

    return config;
  }

  private parsePrompt(input: string) {
    const contents: string[] = [];
    for (const knowledge of this.knowledges) {
      contents.push("This is knowledge provided to you :\n" + knowledge);
    }
    contents.push("User Prompt:\n" + input);
    return contents.join("\n");
  }
}
