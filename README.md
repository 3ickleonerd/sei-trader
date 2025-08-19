# Advanced Cryptocurrency Trading Agent

A sophisticated AI-powered trading agent built with Google's Gemini 2.0 Flash model, featuring a comprehensive workflow for cryptocurrency trading recommendations.

## 🚀 Features

### Core Workflow

1. **Prompt Guard** - Validates trading requests and filters inappropriate content
2. **Token Ticker Extraction** - Identifies cryptocurrency tickers from user prompts
3. **Price History Analysis** - Fetches and analyzes historical price data via CMC API
4. **Trade Decision Engine** - Makes intelligent trading recommendations with risk assessment

### Advanced Features (Optional)

- Market Sentiment Analysis
- Technical Indicators (RSI, MACD, Moving Averages, Bollinger Bands)
- On-Chain Metrics (Active addresses, whale movements, exchange flows)
- Risk Assessment and Position Sizing

## 📁 Project Structure

```
├── agent.ts              # Core Agent class with trading workflow
├── cmc.ts                # CoinMarketCap API integration for price history
├── tokens.ts             # Supported cryptocurrency tokens
├── test.ts               # Basic workflow testing
├── advanced-features.ts  # Enhanced features and demonstrations
├── demo-advanced.ts      # Advanced features demo runner
└── package.json          # Dependencies
```

## 🛠️ Setup

1. Install dependencies:

```bash
bun install
```

2. Set up environment variables:

```bash
# Add to your .env file
GOOGLE_API_KEY=your_google_api_key_here
```

3. Run the basic test:

```bash
bun run test.ts
```

4. Run advanced features demo:

```bash
bun run demo-advanced.ts
```

## 🔄 Workflow Steps

### Step 1: Prompt Guard

- Validates if the user's request is appropriate for cryptocurrency trading
- Returns `{ valid: boolean, reason?: string }`
- Rejects non-crypto requests, inappropriate content, or harmful queries

### Step 2: Token Ticker Extraction

- Analyzes user prompt to identify the cryptocurrency ticker
- Maps common names to available tokens (e.g., "SEI" → "WSEI", "BTC" → "WBTC")
- Returns `{ ticker: string, found: boolean }`

### Step 3: Price History Retrieval

- Fetches historical price data for the identified token
- Currently includes mock data (7 days of price/volume history)
- Ready for real CMC API integration

### Step 4: Trade Decision Analysis

- Combines user prompt, ticker, and price history
- Analyzes market trends, support/resistance levels
- Provides specific entry, stop-loss, and take-profit recommendations
- Includes confidence scoring and risk assessment

## 🎯 Usage Examples

### Basic Trading Request

```typescript
import { Agent } from "./agent";

const agent = new Agent({
  model: "gemini-2.0-flash",
  preamble: "Cryptocurrency Trading Assistant",
});

const result = await agent.processTradeRequest(
  "I want to trade SEI, what's a good entry point?"
);
console.log(result);
```

### Advanced Features Request

```typescript
import { TradingAgentAdvanced } from "./advanced-features";

const advancedAgent = new TradingAgentAdvanced({
  model: "gemini-2.0-flash",
  preamble: "Advanced Trading Agent",
});

// AI can request additional data
const enhancedDecision = await advancedAgent.makeEnhancedTradeDecision(
  "Give me a comprehensive analysis for WSEI",
  "WSEI",
  priceHistory,
  ["sentiment", "technical", "onchain", "risk"] // Optional features
);
```

## 📊 Response Format

### Basic Trade Decision

```json
{
  "token": "WSEI",
  "entry": 68.5,
  "sl": 65.0,
  "tp": 71.0,
  "currentPrice": 67.38,
  "confidence": 85,
  "reject": false,
  "message": "Detailed analysis and reasoning..."
}
```

### Enhanced Decision (with additional data)

```json
{
  "token": "WSEI",
  "entry": 68.5,
  "sl": 65.0,
  "tp": 71.0,
  "currentPrice": 67.38,
  "confidence": 85,
  "reject": false,
  "message": "Comprehensive analysis...",
  "data_used": ["Price History", "Market Sentiment", "Technical Indicators"]
}
```

## 🔧 Configuration

### Supported Tokens

The agent currently supports tokens from the Sei network. See `tokens.ts` for the complete list.

### AI Model Configuration

- Model: Gemini 2.0 Flash
- Response format: Structured JSON
- Temperature: Configurable via agent config
- Tools: Google Search integration available

## 🚦 Error Handling

The system includes comprehensive error handling:

- Invalid prompts are rejected by Prompt Guard
- Unknown tokens return appropriate error messages
- API failures are gracefully handled with fallback responses
- All errors include descriptive messages for debugging

## 🔮 Future Enhancements

1. **Real CMC API Integration** - Replace mock price data with actual CoinMarketCap API calls
2. **Live Trading Integration** - Connect to DEX protocols for actual trade execution
3. **Portfolio Management** - Track and manage multiple positions
4. **Advanced Risk Management** - Dynamic position sizing based on portfolio risk
5. **Backtesting Engine** - Test strategies against historical data
6. **Real-time Monitoring** - Live price alerts and position tracking

## 📝 Notes

- Currently uses mock price data - integrate with real CMC API for production
- Prompt Guard can be customized for specific use cases
- All trading recommendations are for educational purposes only
- Always conduct your own research before making trading decisions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

This is an educational project. All trading recommendations are generated by AI and should not be considered as financial advice. Always do your own research and consult with financial professionals before making investment decisions.
