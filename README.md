<img width="1920" height="1080" alt="Smart Duck (2)" src="https://github.com/user-attachments/assets/badf1a34-43e3-4c68-a0fb-1955f243f6ab" />

# Smart Duck
Fast, precise, and intelligent AI-native trading agent, built on DuckChain network.

## Relevant Links:
- Website: https://seitrader.hetairoi.xyz
- Telegram Bot: http://t.me/seitraderofficialbot

- Dorahacks: https://dorahacks.io/buidl/31702
- X: https://x.com/SeiTrader

- testUSDT Faucet: https://seitrader.hetairoi.xyz/faucet
- Sei Faucet (Testnet): https://docs.sei.io/learn/faucet

## What is Sei Trader?
Smart Duck is a sophisticated, AI-driven cryptocurrency trading bot specifically designed for the **DuckChain network**. Built with an AI-first approach, it provides fast, precise, and intelligent trading capabilities leveraging the unique advantages of DuckChain's infrastructure.


### Key Value Proposition
- **AI-Native Trading**: Powered by Gemini for advanced market analysis
- **DuckChain-Optimized**: Built specifically for DuckChain network's high-speed, low-cost environment
- **Secure Architecture**: Implements smart contract-based escrow system for fund safety
- **User-Friendly**: Accessible through an intuitive Telegram bot interface


---


## Core Features


### AI Trading Intelligence
- **Advanced Market Analysis**: Real-time analysis using Gemini
- **Multi-Token Support**: Supports 30+ tokens on the Sei ecosystem including WSEI, WBTC, WETH, iSEI, and more
- **Intelligent Risk Assessment**: Automated stop-loss and take-profit calculations
- **Market Sentiment Analysis**: Contextual understanding of market conditions
- **Price History Analysis**: 7-day price trend analysis with predictive insights


### Security & Fund Management
- **Smart Contract Escrow**: Secure fund management through CaretEscrow contracts
- **Actor-Based Architecture**: Isolated trading accounts for enhanced security
- **Non-Custodial Design**: Users maintain control of their funds
- **On-Chain Transparency**: All transactions are verifiable on DuckChain network


### User Interface
- **Telegram Bot Integration**: Easy-to-use interface with inline keyboards
- **Real-Time Notifications**: Instant trading alerts and market updates
- **Agent Management**: Create and manage multiple trading agents
- **Portfolio Tracking**: Monitor your trading performance and balances


### Performance Features
- **Real-Time Price Data**: CoinGecko API integration with intelligent caching
- **Fast Execution**: Leverages DuckChain's sub-second finality
- **Low-Cost Operations**: Benefits from DuckChain's minimal transaction fees
- **Scalable Architecture**: Built to handle high-frequency trading operations


---


## How Smart Duck Leverages DuckChain network


### Why DuckChain network?
DuckChain network is the first **parallelized EVM blockchain**, offering unique advantages for DeFi and trading applications:


1. **Lightning-Fast Finality**: 600ms block times enable rapid trade execution
2. **Low Transaction Costs**: Minimal fees make frequent trading economically viable
3. **EVM Compatibility**: Full compatibility with Ethereum tooling and infrastructure
4. **Parallel Processing**: Handles high throughput for complex trading operations


### Smart Contract Architecture

The main orchestration contract that manages:
- **Actor Registration**: Links users to their trading actors
- **Escrow Creation**: Deploys individual escrow contracts for each actor
- **Token Management**: Maintains registry of supported tokens
- **Access Control**: Ensures only authorized server operations

Individual escrow contracts for each trading agent:
- **Secure Fund Storage**: Holds user funds in isolated contracts
- **Controlled Access**: Only actor or server can manage funds
- **Balance Tracking**: Real-time monitoring of token balances
- **Fund Release**: Secure withdrawal mechanisms

---


## Backend


### Architecture Overview
### 1. Trading Bot AI Engine


#### Core Agent System
The `Agent` class serves as the foundation for all AI trading operations:


**Key Capabilities:**
- **Prompt Guard**: Validates user inputs to ensure trading-related queries only
- **Token Extraction**: Intelligently identifies cryptocurrency symbols from natural language
- **Market Analysis**: Processes price history and market data for insights
- **Decision Making**: Generates trading recommendations with confidence scores
- **Risk Management**: Calculates optimal stop-loss and take-profit levels


#### Advanced Trading Features
- **Price History Analysis**: 7-day trend analysis with statistical indicators
- **Volume Analysis**: Market volume patterns for liquidity assessment
- **Volatility Metrics**: Risk assessment based on price movements
- **Market Cap Considerations**: Token stability evaluation
- **Multi-Token Comparison**: Relative performance analysis


#### Market Data Integration
**Live Market Integration**:
- **Real-Time Pricing**: Live price feeds for 30+ DuckChain network tokens
- **Intelligent Caching**: 5-minute cache duration for optimal performance
- **Background Updates**: Asynchronous data refreshing
- **Rate Limiting**: Respects API limits with built-in delays
- **Priority Tokens**: Faster updates for high-volume tokens (WSEI, WBTC, WETH)


### 2. Server Core 


#### System Architecture
The server acts as the central coordinator:
- **Database Management**: SQLite database for user data and agent configurations
- **Health Monitoring**: System status and uptime tracking
- **API Endpoints**: RESTful API for external integrations
- **Migration System**: Automated database schema updates


### 3. Telegram Interface 


#### Bot Architecture
The Telegram bot provides a rich, interactive interface:


**Core Features:**
- **Menu System**: Hierarchical navigation with inline keyboards
- **Agent Management**: Create, view, and manage trading agents
- **Real-Time Trading**: Execute trades directly through chat interface
- **Balance Monitoring**: Check escrow balances and transaction history
- **Error Handling**: Comprehensive error management with user-friendly messages


#### Key User Flows


**Agent Creation Flow:**
1. User initiates agent creation
2. System generates unique actor address using deterministic derivation
3. Smart contract deploys escrow contract
4. Database records agent configuration
5. User receives escrow address for funding


**Trading Flow:**
1. User inputs trading query (natural language)
2. AI analyzes request and market conditions
3. System generates trading recommendation
4. User confirms trade execution
5. Smart contract executes trade through escrow
6. User receives transaction confirmation


#### Advanced Features
- **Concurrent Operation Handling**: Manages multiple user requests simultaneously
- **State Management**: Maintains conversation context across interactions
- **Security Measures**: Input validation and rate limiting
- **Graceful Error Recovery**: Automatic fallback mechanisms

---


### Performance Metrics
- **Response Time**: <10 seconds for AI analysis
- **Cache Hit Rate**: >95% for price data requests
- **Uptime**: 99.9% availability target
- **Concurrent Users**: Supports 1000+ simultaneous users


### Security Features
- **Non-Custodial**: Users maintain full control of funds
- **Smart Contract Auditing**: OpenZeppelin battle-tested contracts
- **Input Validation**: Comprehensive prompt and data validation
- **Rate Limiting**: Protection against abuse and spam
- **Error Isolation**: Graceful failure handling


---


## Getting Started

1. Start a conversation with the Smart Duck Telegram bot (http://t.me/seitraderofficialbot)
2. Create your first trading agent
3. Fund your escrow address with USDT & SEI (Use faucets on testnet)
4. Begin asking for trading advice and execute trades

---

**Built with ❤️ for the DuckChain ecosystem** 🌊
