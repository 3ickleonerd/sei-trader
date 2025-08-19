import { Agent } from "./agent";

// Create the main trading agent
const agent = new Agent({
  model: "gemini-2.0-flash",
  preamble: `You are a sophisticated cryptocurrency trading bot with advanced analysis capabilities.`,
});

// Test the complete workflow
async function testTradingWorkflow() {
  console.log("🚀 Starting Trading Agent Workflow Test\n");

  // Test cases
  const testPrompts = [
    "I want to trade SEI, what's a good entry point?",
    "Give me a trading strategy for BTC",
    "What about some stock trading advice?", // This should be rejected by prompt guard
    "Should I buy WSEI now?",
  ];

  for (const prompt of testPrompts) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔍 Testing prompt: "${prompt}"`);
    console.log(`${"=".repeat(60)}\n`);

    const result = await agent.processTradeRequest(prompt);

    // Display results
    console.log("📊 WORKFLOW RESULTS:");
    console.log(
      `✅ Prompt Guard: ${result.guardResult.valid ? "PASSED" : "FAILED"}`
    );
    if (!result.guardResult.valid) {
      console.log(`❌ Reason: ${result.guardResult.reason}`);
    }

    if (result.tickerResult) {
      console.log(
        `🎯 Ticker Extracted: ${result.tickerResult.ticker} (Found: ${result.tickerResult.found})`
      );
    }

    if (result.priceHistory) {
      console.log(
        `📈 Price History: ${
          result.priceHistory.success ? "SUCCESS" : "FAILED"
        }`
      );
      if (result.priceHistory.success) {
        const latestPrice =
          result.priceHistory.data[result.priceHistory.data.length - 1];
        console.log(`💰 Current Price: $${latestPrice.price.toFixed(4)}`);
      }
    }

    if (result.tradeDecision) {
      console.log(`\n🤖 TRADE RECOMMENDATION:`);
      console.log(`Token: ${result.tradeDecision.token}`);
      console.log(`Entry: $${result.tradeDecision.entry}`);
      console.log(`Stop Loss: $${result.tradeDecision.sl}`);
      console.log(`Take Profit: $${result.tradeDecision.tp}`);
      console.log(`Current Price: $${result.tradeDecision.currentPrice}`);
      console.log(`Confidence: ${result.tradeDecision.confidence}%`);
      console.log(`Rejected: ${result.tradeDecision.reject ? "YES" : "NO"}`);
      console.log(`Message: ${result.tradeDecision.message}`);
    }

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    console.log(`\n${"=".repeat(60)}\n`);
  }
}

// Run the test
testTradingWorkflow().catch(console.error);
