# Sei Trader - Complete Context for LLMs

## What is Sei Trader?

Sei Trader is an AI-powered cryptocurrency trading bot specifically designed for the Sei Network. It combines Google's Gemini 2.0 Flash AI model with smart contract-based escrow systems to provide secure, intelligent trading capabilities through a Telegram interface.

**Core Value Proposition**: AI-native trading optimized for Sei Network's high-speed, low-cost environment with non-custodial fund security.

## Key Features

### AI Trading Intelligence
- **Advanced Market Analysis**: Real-time analysis using Google Gemini 2.0 Flash
- **Multi-Token Support**: 100+ tokens on Sei ecosystem (WSEI, WBTC, WETH, iSEI, SEIYAN, FXS, ROCK, etc.)
- **Intelligent Risk Assessment**: Automated stop-loss and take-profit calculations
- **Natural Language Processing**: Understands trading queries in plain English
- **Price History Analysis**: 7-day trend analysis with predictive insights
- **Market Sentiment Analysis**: Contextual understanding of market conditions

### Security & Fund Management
- **Smart Contract Escrow**: Secure fund management through CaretEscrow contracts
- **Actor-Based Architecture**: Isolated trading accounts for enhanced security
- **Non-Custodial Design**: Users maintain full control of their funds
- **Deterministic Key Derivation**: Predictable actor addresses from user seeds
- **On-Chain Transparency**: All transactions verifiable on Sei Network

### User Interface
- **Telegram Bot Integration**: Rich interface with inline keyboards and menus
- **Real-Time Notifications**: Instant trading alerts and market updates
- **Agent Management**: Create and manage multiple trading agents
- **Portfolio Tracking**: Monitor trading performance and balances
- **Natural Language Commands**: "Should I buy WSEI?" or "What's the best crypto to trade?"

### Performance Features
- **Real-Time Price Data**: CoinGecko API integration with intelligent caching
- **Fast Execution**: Leverages Sei's sub-second finality
- **Low-Cost Operations**: Benefits from Sei's minimal transaction fees
- **Scalable Architecture**: Built for high-frequency trading operations

## How Sei Trader Leverages Sei Network

### Why Sei Network?
Sei Network is the first **parallelized EVM blockchain**, offering unique advantages:

1. **Lightning-Fast Finality**: 600ms block times enable rapid trade execution
2. **Low Transaction Costs**: Minimal fees make frequent trading economically viable
3. **EVM Compatibility**: Full compatibility with Ethereum tooling and infrastructure
4. **Parallel Processing**: Handles high throughput for complex trading operations

### Smart Contract Architecture

#### CaretOrchestrator Contract
- **Actor Registration**: Links users to their trading actors
- **Escrow Creation**: Deploys individual escrow contracts for each actor
- **Token Management**: Maintains registry of supported tokens
- **Access Control**: Ensures only authorized server operations

#### CaretEscrow Contract
- **Secure Fund Storage**: Holds user funds in isolated contracts
- **Controlled Access**: Only actor or server can manage funds
- **Balance Tracking**: Real-time monitoring of token balances
- **Fund Release**: Secure withdrawal mechanisms

## AI Backend Architecture

### Core Components

#### 1. Trading Bot AI Engine (`src/bot/`)
- **Agent Class**: Foundation for all AI trading operations
- **Enhanced Workflow**: Complete pipeline from user input to trading recommendation
- **Prompt Guard**: Validates inputs for trading relevance
- **Token Extraction**: Intelligently identifies cryptocurrency symbols
- **Market Analysis**: Processes price history and market data
- **Decision Making**: Generates trading recommendations with confidence scores

#### 2. Server Core (`src/server/`)
- **Database Management**: SQLite database for user data and agent configurations
- **Health Monitoring**: System status and uptime tracking
- **API Endpoints**: RESTful API for external integrations
- **Migration System**: Automated database schema updates

#### 3. Telegram Interface (`src/telegram/`)
- **Menu System**: Hierarchical navigation with inline keyboards
- **Agent Management**: Create, view, and manage trading agents
- **Real-Time Trading**: Execute trades directly through chat interface
- **Balance Monitoring**: Check escrow balances and transaction history
- **Error Handling**: Comprehensive error management with user-friendly messages

### AI Processing Pipeline

```
User Query → Prompt Guard → Ticker Extraction → Market Data Fetch → AI Analysis → Trading Decision → Formatted Response
```

#### Key AI Features
- **Multi-Stage Validation**: Ensures only trading-related queries are processed
- **Intelligent Caching**: 5-minute cache duration for optimal performance
- **Background Updates**: Asynchronous data refreshing
- **Rate Limiting**: Respects API limits with built-in delays
- **Structured Output**: Zod schema validation for consistent responses

## Technical Stack

### Technology Stack
- **Runtime**: Bun.js for high-performance JavaScript execution
- **AI Model**: Google Gemini 2.0 Flash for advanced reasoning
- **Blockchain**: Sei Network (EVM-compatible)
- **Smart Contracts**: Solidity with OpenZeppelin libraries
- **Database**: SQLite for local data persistence
- **API Integration**: CoinGecko for market data
- **Bot Framework**: Grammy.js for Telegram integration
- **Type Safety**: TypeScript with Zod validation

### Performance Metrics
- **Response Time**: <2 seconds for AI analysis
- **Cache Hit Rate**: >95% for price data requests
- **Uptime**: 99.9% availability target
- **Concurrent Users**: Supports 1000+ simultaneous users
- **Transaction Speed**: <1 second on Sei Network

## User Workflows

### Agent Creation Flow
1. User initiates agent creation via Telegram
2. System generates unique actor address using deterministic derivation
3. Smart contract deploys escrow contract
4. Database records agent configuration
5. User receives escrow address for funding

### Trading Flow
1. User inputs trading query (natural language)
2. AI analyzes request and market conditions
3. System generates trading recommendation
4. User confirms trade execution
5. Smart contract executes trade through escrow
6. User receives transaction confirmation

### Example User Interactions
```
User: "Should I buy WSEI today?"
Bot: "📊 AI Analysis: WSEI
Current Price: $0.42
24h Change: +5.2%

🎯 Trading Recommendation:
Entry Point: $0.40 - $0.42
Stop Loss: $0.38 (-10%)
Take Profit: $0.48 (+15%)

Confidence: 78%

[Execute Trade] [Get Details] [Ask Question]"

User: "What's happening in the crypto market?"
Bot: "🌍 Market Overview
📊 Overall Sentiment: Cautiously Optimistic
📈 Sei Network Trend: +3.2% (24h)

🔥 Top Opportunities:
1. WSEI - Bullish breakout pattern
2. iSEI - Strong staking yields
3. WBTC - Bitcoin correlation play"
```

## Security Features

### Multi-Layer Security Model
- **Input Validation**: Comprehensive prompt and data validation
- **Access Control**: Smart contract-based permission system
- **Rate Limiting**: Protection against abuse and spam
- **Error Isolation**: Graceful failure handling
- **Non-Custodial**: Users maintain full control of funds

### Actor System Security
- **Deterministic Generation**: Predictable actor addresses from user seeds
- **Account Isolation**: Each agent has separate blockchain account
- **Escrow Protection**: Funds secured in smart contracts
- **Audit Trail**: All transactions logged and verifiable

## Supported Tokens

### Primary Tokens
- **WSEI**: Wrapped SEI (native token)
- **WBTC**: Wrapped Bitcoin
- **WETH**: Wrapped Ethereum
- **iSEI**: Staked SEI
- **USDT**: Tether USD
- **USDC**: USD Coin

### Additional Tokens
- **SEIYAN**: SEI ecosystem token
- **FXS**: Frax Share
- **ROCK**: Rock token
- **ASTRO**: Astroport token
- **And 90+ more Sei ecosystem tokens**

## Deployment & Infrastructure

### Development Setup
- **Bun.js Runtime**: High-performance JavaScript execution
- **Hardhat**: Smart contract development and deployment
- **SQLite**: Local database for development
- **Sei Testnet**: Testing environment

### Production Deployment
- **Docker**: Containerized deployment
- **Nginx**: Reverse proxy and load balancing
- **SSL/TLS**: Secure HTTPS connections
- **Monitoring**: Health checks and performance metrics
- **Backup**: Automated database backups

## Key Differentiators

### AI-First Design
- Built specifically for AI-powered trading
- Natural language understanding
- Contextual market analysis
- Continuous learning capabilities

### Sei Network Optimization
- Leverages Sei's parallelized EVM
- Fast transaction finality
- Low-cost operations
- Native ecosystem integration

### Security Focus
- Non-custodial architecture
- Smart contract escrow system
- Deterministic key derivation
- Transparent on-chain operations

### User Experience
- Intuitive Telegram interface
- Natural language commands
- Real-time notifications
- Comprehensive portfolio management

## Use Cases

### Individual Traders
- AI-assisted trading decisions
- Portfolio diversification
- Risk management
- Market analysis

### DeFi Enthusiasts
- Sei ecosystem exploration
- Yield farming opportunities
- Token discovery
- Cross-chain arbitrage

### Crypto Beginners
- Educational trading platform
- Risk-controlled environment
- AI guidance
- Learning opportunities

## Future Roadmap

### Planned Features
- **Machine Learning Models**: Custom models trained on Sei data
- **Multi-Chain Support**: Cross-chain trading capabilities
- **Advanced Analytics**: Portfolio optimization and backtesting
- **Social Trading**: Copy successful traders
- **Mobile App**: Native mobile application

### Technical Enhancements
- **Edge Computing**: Reduced latency deployment
- **Real-Time Streaming**: Live market data feeds
- **Advanced Caching**: Multi-level cache optimization
- **API Expansion**: Additional data sources

## Summary

Sei Trader represents a new paradigm in cryptocurrency trading - combining the speed and efficiency of the Sei Network with the intelligence of advanced AI models. It provides users with a secure, non-custodial platform for AI-assisted trading while maintaining full control over their funds through smart contract escrow systems.

The platform's unique value proposition lies in its AI-first design, Sei Network optimization, and comprehensive security model, making it an ideal solution for both experienced traders and newcomers to the cryptocurrency space.
